import type { LocalOrder } from './db';

// Basic ESC/POS commands
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';
const ALIGN_CENTER = ESC + 'a1';
const ALIGN_LEFT = ESC + 'a0';
const BOLD_ON = ESC + 'E1';
const BOLD_OFF = ESC + 'E0';
const DOUBLE_HEIGHT_WIDTH = GS + '!\x11';
const NORMAL_TEXT = GS + '!\x00';
const FEED_AND_CUT = GS + 'V\x41\x03'; // feed 3 lines and cut

const NEWLINE = '\n';

function generateReceiptPayload(order: LocalOrder, items: any[]): Uint8Array {
  let receipt = '';
  
  // Header
  receipt += INIT;
  receipt += ALIGN_CENTER;
  receipt += DOUBLE_HEIGHT_WIDTH + 'POSX' + NEWLINE;
  receipt += '123 Coffee Lane, Brew City' + NEWLINE;
  receipt += 'Tel: (555) 123-4567' + NEWLINE + NEWLINE;
  
  // Order Info
  receipt += ALIGN_LEFT;
  receipt += `Order ID: ${order.id.split('-')[0].toUpperCase()}` + NEWLINE;
  receipt += `Date: ${new Date(order.created_at).toLocaleString()}` + NEWLINE;
  receipt += `Customer: ${order.customer_name}` + NEWLINE;
  receipt += `Type: ${order.order_type}` + NEWLINE;
  if (order.table_number && order.order_type === 'Dine In') {
    receipt += `Table: ${order.table_number}` + NEWLINE;
  }
  receipt += '-'.repeat(32) + NEWLINE;
  
  const currencySymbol = localStorage.getItem('currencySymbol') || '₱';
  
  // Items
  items.forEach(item => {
    const itemName = item.products?.name || 'Item';
    const qty = item.quantity;
    const price = (item.unit_price * qty).toFixed(2);
    
    // Format: ItemName xQty  $Price (right aligned)
    // Simplified for 32 character width
    const line1 = `${itemName} x${qty}`;
    const padding = Math.max(0, 32 - line1.length - price.length - currencySymbol.length);
    receipt += line1 + ' '.repeat(padding) + currencySymbol + price + NEWLINE;
  });
  
  receipt += '-'.repeat(32) + NEWLINE;
  
  // Totals
  const subtotalLine = `Subtotal:`;
  const subPad = Math.max(0, 32 - subtotalLine.length - order.subtotal.toFixed(2).length - currencySymbol.length);
  receipt += subtotalLine + ' '.repeat(subPad) + currencySymbol + order.subtotal.toFixed(2) + NEWLINE;
  
  const taxLine = `Tax (10%):`;
  const taxPad = Math.max(0, 32 - taxLine.length - order.tax.toFixed(2).length - currencySymbol.length);
  receipt += taxLine + ' '.repeat(taxPad) + currencySymbol + order.tax.toFixed(2) + NEWLINE;
  
  receipt += BOLD_ON;
  const totalLine = `TOTAL:`;
  const totalPad = Math.max(0, 32 - totalLine.length - order.total.toFixed(2).length - currencySymbol.length);
  receipt += DOUBLE_HEIGHT_WIDTH + totalLine + ' '.repeat(totalPad) + currencySymbol + order.total.toFixed(2) + NEWLINE;
  receipt += NORMAL_TEXT + BOLD_OFF;
  
  receipt += '-'.repeat(32) + NEWLINE;
  receipt += ALIGN_CENTER;
  
  // QR Code tracking URL (Simulated by just text for raw ESC/POS without graphics)
  const trackUrl = `${window.location.origin}/track/${order.id}`;
  receipt += 'Track your order live:' + NEWLINE;
  receipt += trackUrl + NEWLINE + NEWLINE;
  
  receipt += 'Thank you for your visit!' + NEWLINE;
  receipt += FEED_AND_CUT;
  
  // Convert string to Uint8Array (Code Page 437/UTF-8 depending on printer)
  const encoder = new TextEncoder();
  return encoder.encode(receipt);
}

export async function printReceipt(order: LocalOrder, items: any[]) {
  try {
    const payload = generateReceiptPayload(order, items);
    
    // WebUSB Implementation
    // Note: This requires the user to grant permission to the USB device
    // and only works in secure contexts (HTTPS or localhost)
    
    if (!(navigator as any).usb) {
      console.warn('WebUSB not supported in this browser. Printing simulated.');
      console.log('--- RECEIPT PAYLOAD ---');
      console.log(new TextDecoder().decode(payload));
      return { success: true, simulated: true };
    }

    // Request device (filters can be added for specific printer vendor/product IDs)
    const device = await (navigator as any).usb.requestDevice({ filters: [] });
    
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    
    await device.claimInterface(0); // Usually 0 for printers
    
    // Find the bulk out endpoint
    let outEndpoint;
    for (const alt of device.configuration.interfaces[0].alternates) {
      for (const ep of alt.endpoints) {
        if (ep.direction === 'out' && ep.type === 'bulk') {
          outEndpoint = ep.endpointNumber;
          break;
        }
      }
    }
    
    if (!outEndpoint) {
      throw new Error('No bulk out endpoint found on USB device.');
    }

    await device.transferOut(outEndpoint, payload);
    await device.close();
    
    return { success: true, simulated: false };
    
  } catch (error) {
    console.error('Printing failed:', error);
    // Fallback or just log it
    return { success: false, error };
  }
}
