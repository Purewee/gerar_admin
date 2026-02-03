import { useRef, useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import type { OrderEbarimt, OrderItem } from '@/queries/order/type';

const formatMNT = (v?: number | string | null) =>
  v == null ? '-' : `${Number(v).toLocaleString('mn-MN')} ₮`;

/** Normalize ebarimt payload: support both camelCase (API) and snake_case (full payload). */
function normalize(data: OrderEbarimt) {
  return {
    receiptUrl: data.receiptUrl ?? data.receipt_url ?? null,
    ebarimtId: data.ebarimtId ?? data.ebarimt_id ?? null,
    receiptId: data.ebarimt_receipt_id ?? data.ebarimtReceiptId ?? null,
    qrData: data.ebarimt_qr_data ?? data.ebarimtQrData ?? null,
    status: data.ebarimt_status ?? data.barimt_status ?? null,
    lottery: data.ebarimt_lottery ?? data.ebarimtLottery ?? null,
    amount: data.amount ?? null,
    vatAmount: data.vat_amount ?? null,
    cityTaxAmount: data.city_tax_amount ?? null,
    merchantRegisterNo: data.merchant_register_no ?? null,
    merchantTin: data.merchant_tin ?? null,
    receiverType: data.ebarimt_receiver_type ?? null,
    receiver: data.ebarimt_receiver ?? null,
    receiverPhone: data.ebarimt_receiver_phone ?? null,
    ebarimtBy: data.ebarimt_by ?? null,
    paidBy: data.paid_by ?? null,
    objectType: data.object_type ?? null,
    note: data.note ?? null,
    statusDate: data.barimt_status_date ?? data.created_date ?? null,
  };
}

export interface EbarimtReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: OrderEbarimt | null;
  items?: OrderItem[];
  orderId?: string;
  receiverName?: string | null;
  receiverPhone?: string | null;
  address?: string | Record<string, unknown> | null;
  merchantName?: string;
}

const EXCLUDED_ADDRESS_KEYS = new Set([
  'id',
  'userId',
  'user_id',
  'label',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
]);

function formatAddress(addr: string | Record<string, unknown> | null | undefined): string | null {
  if (!addr) return null;
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [
      (addr as Record<string, unknown>).city,
      (addr as Record<string, unknown>).district,
      (addr as Record<string, unknown>).khoroo,
      (addr as Record<string, unknown>).street,
      (addr as Record<string, unknown>).details ||
        (addr as Record<string, unknown>).address ||
        (addr as Record<string, unknown>).addressText,
    ];
    const joined = parts.filter(Boolean).join(', ');
    if (joined) return joined;
    return Object.entries(addr)
      .filter(
        ([key, v]) =>
          !EXCLUDED_ADDRESS_KEYS.has(key) &&
          (typeof v === 'string' || typeof v === 'number')
      )
      .map(([, v]) => v)
      .join(', ');
  }
  return String(addr);
}

export function EbarimtReceiptDialog({
  open,
  onOpenChange,
  data,
  items,
  orderId,
  receiverName,
  receiverPhone,
  address,
  merchantName,
}: EbarimtReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [qrImg, setQrImg] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const n = useMemo(() => (data ? normalize(data) : null), [data]);
  const formattedAddress = useMemo(() => formatAddress(address), [address]);

  useEffect(() => {
    if (n?.qrData) {
      QRCode.toDataURL(n.qrData, { margin: 1, width: 150 })
        .then(setQrImg)
        .catch(() => setQrImg(null));
    } else {
      setQrImg(null);
    }
  }, [n?.qrData]);

  const handlePrint = () => {
    if (printing || !printRef.current) return;
    setPrinting(true);
    const printContent = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) {
      setPrinting(false);
      return;
    }
    win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ебаримт ${orderId ?? ''}</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; padding: 0; width: 80mm; max-width: 100%; margin: 0 auto; color: #000; }
            .receipt-container { padding: 20px 10px; background: #fff; }
            .receipt-header { text-align: center; margin-bottom: 12px; }
            .receipt-title { font-size: 1.1rem; font-weight: bold; text-transform: uppercase; margin: 0; }
            .receipt-subtitle { font-size: 0.85rem; margin-top: 4px; }
            
            .divider { border-top: 1px dashed #000; margin: 8px 0; width: 100%; }
            .divider-solid { border-top: 1px solid #000; margin: 8px 0; width: 100%; }
            
            .info-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }
            .info-label { }
            .info-value { font-weight: 600; text-align: right; }
            
            .items-table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 0.8rem; }
            .items-table th { text-align: left; border-bottom: 1px dashed #000; padding-bottom: 4px; font-weight: bold; }
            .items-table td { padding: 4px 0; vertical-align: top; }
            .col-name { width: 50%; }
            .col-qty { text-align: center; width: 15%; }
            .col-price { text-align: right; width: 35%; }
            
            .total-section { margin-top: 8px; font-size: 0.9rem; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            .total-row.grand-total { font-weight: bold; font-size: 1.1rem; margin-top: 8px; }
            
            .qr-wrap { text-align: center; margin: 20px 0 10px; }
            .qr-wrap svg { display: block; margin: 0 auto; }
            
            .lottery-box { 
              border: 1px dashed #000; 
              padding: 8px; 
              text-align: center; 
              margin: 12px 0; 
              font-weight: bold;
              font-size: 1rem; 
            }
            
            .footer { text-align: center; font-size: 0.75rem; margin-top: 20px; }
          </style>
        </head>
        <body>${printContent}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
      setPrinting(false);
    }, 250);
  };

  const canShowReceipt = n && (n.qrData || n.receiptId || n.lottery || n.amount);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto overflow-x-hidden scroll-snap-y snap-y snap-mandatory">
          <DialogHeader>
            <DialogTitle>Ебаримт {orderId ? `#${orderId}` : ''}</DialogTitle>
          </DialogHeader>
          {canShowReceipt ? (
            <div ref={printRef} className="ebarimt-receipt-print font-mono text-sm leading-tight p-4 bg-white text-black">
              {/* Header */}
              <div className="receipt-header text-center mb-4">
                <h2 className="receipt-title text-lg font-bold uppercase tracking-wider">{merchantName ?? 'GERAR'}</h2>
                {n.merchantTin && (
                  <div className="receipt-subtitle text-xs mt-1">ТТД: {n.merchantTin}</div>
                )}
                <div className="receipt-subtitle text-xs">Улаанбаатар хот</div>
              </div>

              {/* Meta Info */}
              <div className="receipt-section space-y-1 text-xs mb-3">
                 {n.receiptId && (
                  <div className="info-row flex justify-between">
                    <span className="info-label">ДДТД:</span>
                    <span className="info-value font-semibold">{n.receiptId}</span>
                  </div>
                )}
                {n.merchantRegisterNo && (
                   <div className="info-row flex justify-between">
                    <span className="info-label">Регистр:</span>
                    <span className="info-value">{n.merchantRegisterNo}</span>
                  </div>
                )}
                 {n.statusDate && (
                  <div className="info-row flex justify-between">
                    <span className="info-label">Огноо:</span>
                    <span className="info-value">
                      {new Date(n.statusDate).toLocaleString('mn-MN', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
                 {orderId && (
                  <div className="info-row flex justify-between">
                    <span className="info-label">Захиалга:</span>
                    <span className="info-value">#{orderId}</span>
                  </div>
                )}

              </div>

              <div className="divider border-t border-dashed border-black my-2" />

              {/* Items List */}
              {items && items.length > 0 ? (
                <div className="items-section mb-3">
                  <table className="items-table w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left py-1 border-b border-dashed border-black">Бараа</th>
                        <th className="text-center py-1 border-b border-dashed border-black w-12">Тоо</th>
                        <th className="text-right py-1 border-b border-dashed border-black">Дүн</th>
                      </tr>
                    </thead>
                    <tbody className="pt-2">
                       {items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-1 pr-2 align-top">{item.product?.name || 'Бараа'}</td>
                          <td className="py-1 px-1 text-center align-top">{item.quantity}</td>
                          <td className="py-1 text-right align-top font-semibold">
                            {formatMNT(Number(item.price) * item.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="divider border-t border-dashed border-black my-2" />
              )}

              {/* Totals */}
               {(n.amount != null || n.vatAmount != null) && (
                <div className="total-section space-y-1 text-xs">
                   {n.vatAmount != null && (
                    <div className="total-row flex justify-between">
                      <span>НӨАТ:</span>
                      <span>{formatMNT(n.vatAmount)}</span>
                    </div>
                  )}
                  {n.cityTaxAmount != null && Number(n.cityTaxAmount) !== 0 && (
                    <div className="total-row flex justify-between">
                      <span>НХАТ:</span>
                      <span>{formatMNT(n.cityTaxAmount)}</span>
                    </div>
                  )}
                  {n.amount != null && (
                    <div className="total-row grand-total flex justify-between text-base font-bold mt-2 pt-2 border-t border-dashed border-black">
                      <span>НИЙТ ДҮН:</span>
                      <span>{formatMNT(n.amount)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Info */}
              {(receiverName || receiverPhone || address) && (
                  <div className="mt-3 pt-2 border-t border-dashed border-black">
                    {receiverName && (
                      <div className="info-row flex justify-between">
                        <span className="info-label">Хүлээн авагч:</span>
                        <span className="info-value text-right" style={{ maxWidth: '60%' }}>{receiverName}</span>
                      </div>
                    )}
                    {receiverPhone && (
                      <div className="info-row flex justify-between">
                         <span className="info-label">Утас:</span>
                         <span className="info-value">{receiverPhone}</span>
                      </div>
                    )}
                    {formattedAddress && (
                      <div className="info-row flex flex-col mt-1">
                        <span className="info-label">Хаяг:</span>
                        <span className="info-value text-left text-[10px] leading-tight break-words mt-1">
                          {formattedAddress}
                        </span>
                      </div>
                    )}
                  </div>
                )}

              {/* Footer Info */}
              <div className="footer-info mt-6 space-y-1 text-xs">
                 {(n.receiver != null || n.receiverPhone != null) && (
                  <div className="mb-2">
                    {n.receiverType && (
                      <div className="text-[10px] uppercase text-gray-500">{n.receiverType}</div>
                    )}
                    {n.receiver != null && (
                       <div className="flex justify-between">
                        <span>Хүлээн авагч:</span>
                        <span>{n.receiver}</span>
                      </div>
                    )}
                     {n.receiverPhone != null && (
                       <div className="flex justify-between">
                        <span>Утас:</span>
                        <span>{n.receiverPhone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

               {/* Lottery */}
               {n.lottery && (
                <div className="lottery-box border border-dashed border-black p-2 my-4 text-center">
                  <div className="text-xs text-gray-600 mb-1">Cугалааны дугаар</div>
                  <div className="text-lg font-bold">{n.lottery}</div>
                  {n.amount != null && <div className="text-lg font-bold mt-1">{formatMNT(n.amount)}</div>}
                </div>
              )}

              {/* QR Code - img for reliable thermal printing */}
              {qrImg && (
                <div className="qr-wrap flex flex-col items-center my-4">
                  <img src={qrImg} width={150} height={150} alt="QR" />
                </div>
              )}

              <div className="footer text-center text-[10px] mt-4 text-gray-500">
                <p>Манайхаар үйлчлүүлсэнд баярлалаа!</p>
                <p className="mt-1">GERAR.MN</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Ебаримтын мэдээлэл олдсонгүй.
            </p>
          )}
          {canShowReceipt && (
            <DialogFooter>
              <Button type="button" onClick={handlePrint} className="gap-2" autoFocus disabled={printing}>
                <Printer className="h-4 w-4" />
                Хэвлэх
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
