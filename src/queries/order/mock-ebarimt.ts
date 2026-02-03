/**
 * Mock ebarimt data for testing the Print receipt flow.
 * Set USE_MOCK_EBARIMT to false to use the real API again.
 */
import type { OrderEbarimt } from './type';

export const USE_MOCK_EBARIMT = true;

export const MOCK_EBARIMT: OrderEbarimt = {
  ebarimt_id: "9601787b-c623-4027-b7d1-e1bfbf4e3abb",
  receipt_url: null,
  ebarimt_receipt_id: "030101065006000095230000010014863",
  ebarimt_qr_data: "354398584145535194853244025890100834917755095245500369525354303195214271781229675106095070576069388718508582470758573249952181059684687084715796514268143666191",
  ebarimt_status: "REGISTERED",
  ebarimt_lottery: "RA 31370563",
  ebarimt_by: "QPAY",
  ebarimt_receiver_type: "CITIZEN",
  ebarimt_receiver: "80650025",
  ebarimt_receiver_phone: "80*50*25",
  merchant_register_no: "7236945",
  merchant_tin: "30101065006",
  amount: "100.00",
  vat_amount: "9.0909",
  city_tax_amount: "0.0000",
  paid_by: "P2P",
  object_type: "INVOICE",
  note: null,
  barimt_status: "REGISTERED",
  barimt_status_date: "2026-02-02T06:58:45.000Z",
  created_date: "2026-02-02T06:58:45.763Z",
};
