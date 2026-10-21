'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Download, Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { getUserTimezone, formatDateOnly, formatTimeOnly } from '@/utils/timezoneUtils'

const GLOBEFLIGHT_INFO = {
  headOffice: 'Nairobi, Kenya',
  registrationNo: 'BN 1234567',
  vatNo: 'VAT 123456789',
  phone: '+254 (0) 123 456 789',
  email: 'info@globeflight.co.ke',
  website: 'www.globeflight.co.ke'
}

export default function PublicWaybillViewer({ shipment, onClose }) {
  const waybillRef = useRef(null)
  const barcodeRef = useRef(null)
  const qrCodeRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [enhancedShipment, setEnhancedShipment] = useState(null)

  // Parse additional shipment data from packageDescription if it's JSON (same as admin dashboard)
  const getEnhancedShipmentData = (shipmentData) => {
    try {
      if (shipmentData.packageDescription && shipmentData.packageDescription.startsWith('{')) {
        const parsed = JSON.parse(shipmentData.packageDescription);
        return {
          ...shipmentData,
          ...parsed,
          packageDescription: parsed.description || shipmentData.packageDescription
        };
      }
    } catch (e) {
      // If parsing fails, return original shipment
    }
    return shipmentData;
  };

  useEffect(() => {
    if (shipment) {
      setEnhancedShipment(getEnhancedShipmentData(shipment))
      generateWaybill()
    }
  }, [shipment])

  const generateWaybill = async () => {
    try {
      setError('')
      await new Promise(resolve => setTimeout(resolve, 100))

      // Generate barcode
      if (barcodeRef.current && shipment.trackingNumber) {
        try {
          JsBarcode(barcodeRef.current, shipment.trackingNumber, {
            format: 'CODE128',
            width: 1.5,
            height: 40,
            displayValue: false,
            background: '#ffffff',
            lineColor: '#000000',
            margin: 5
          })
        } catch (err) {
          console.error('Barcode error:', err)
        }
      }

      // Generate QR code
      if (qrCodeRef.current && shipment.trackingNumber) {
        try {
          const qrData = JSON.stringify({
            trackingNumber: shipment.trackingNumber,
            sender: shipment.senderName,
            receiver: shipment.receiverName,
            origin: shipment.origin,
            destination: shipment.destination,
            service: 'Globeflight Worldwide Express'
          })

          QRCode.toCanvas(qrCodeRef.current, qrData, {
            width: 80,
            height: 80,
            margin: 1,
            color: { dark: '#000000', light: '#FFFFFF' }
          })
        } catch (err) {
          console.error('QR error:', err)
        }
      }

      setLoading(false)
    } catch (err) {
      setError('Failed to generate waybill')
      console.error('Error:', err)
      setLoading(false)
    }
  }

  const downloadWaybill = async () => {
    if (!waybillRef.current) return

    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      const canvas = await html2canvas(waybillRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 794,
        windowHeight: 1123
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297)
      pdf.save(`Waybill-${shipment.trackingNumber}.pdf`)
    } catch (err) {
      console.error('Download error:', err)
      setError('Failed to download waybill')
    }
  }

  const printWaybill = async () => {
    if (!waybillRef.current) return

    await new Promise(resolve => setTimeout(resolve, 500))

    const printWindow = window.open('', '_blank')
    const waybillHTML = waybillRef.current?.innerHTML || ''

    printWindow.document.write(`
      <html>
        <head>
          <title>Waybill - ${shipment.trackingNumber}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.2; color: #000; background: white; }
            @page { margin: 0.5in; size: A4 portrait; }
          </style>
        </head>
        <body>${waybillHTML}</body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 1000)
  }

  if (!shipment) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Enhanced Waybill</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 m-4 rounded">
            {error}
          </div>
        )}

        {loading && (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-4 text-gray-600">Generating waybill...</p>
          </div>
        )}

        {!loading && (
          <>
            <div ref={waybillRef} className="bg-white text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
              {/* Modern Header */}
              <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-gray-50 to-white border-b-4 border-green-600">
                {/* Left: Company Info */}
                <div className="flex gap-3 items-center border-r border-gray-300 pr-4">
                  <div className="flex-shrink-0">
                    <div className="text-2xl font-bold text-green-600">G</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-green-600">GLOBEFLIGHT</div>
                    <div className="text-xs text-gray-600">Worldwide Express</div>
                    <div className="text-xs text-gray-500 mt-1">{GLOBEFLIGHT_INFO.headOffice}</div>
                  </div>
                </div>

                {/* Center: Tracking Info */}
                <div className="flex flex-col justify-center gap-3 border-r border-gray-300 pr-4">
                  <div>
                    <div className="text-xs font-bold text-gray-600 uppercase tracking-wider">Tracking Number</div>
                    <div className="text-lg font-bold text-green-600 mt-1">{shipment.trackingNumber}</div>
                  </div>

                  {/* Third Party Tracking - If Present */}
                  {shipment.thirdPartyTrackingNumber && (
                    <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-red-500 rounded p-2">
                      <div className="text-xs font-bold text-red-600 uppercase tracking-wider">3rd Party Tracking</div>
                      <div className="text-sm font-bold text-red-600 mt-1">{shipment.thirdPartyTrackingNumber}</div>
                    </div>
                  )}
                </div>

                {/* Right: Barcode & QR */}
                <div className="flex gap-3 items-center justify-end">
                  <div className="flex-1 flex justify-center">
                    <canvas ref={barcodeRef} className="max-w-full"></canvas>
                  </div>
                  <div className="flex-shrink-0 bg-white border border-gray-300 rounded p-2">
                    <canvas ref={qrCodeRef} className="w-16 h-16"></canvas>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* From */}
                <div className="border p-3">
                  <div className="font-bold text-xs mb-2">FROM (SHIPPER)</div>
                  <div className="text-xs space-y-1">
                    <div><strong>{shipment.senderName}</strong></div>
                    <div>{shipment.senderAddress}</div>
                    <div>{shipment.senderCity}, {shipment.senderCountry}</div>
                    <div>Phone: {shipment.senderPhone}</div>
                    <div>Email: {shipment.senderEmail}</div>
                  </div>
                </div>

                {/* To */}
                <div className="border p-3">
                  <div className="font-bold text-xs mb-2">TO (RECEIVER)</div>
                  <div className="text-xs space-y-1">
                    <div><strong>{shipment.receiverName}</strong></div>
                    <div>{shipment.receiverAddress}</div>
                    <div>{shipment.receiverCity}, {shipment.receiverCountry}</div>
                    <div>Phone: {shipment.receiverPhone}</div>
                    <div>Email: {shipment.receiverEmail}</div>
                  </div>
                </div>
              </div>

              {/* Shipment Details */}
              <div className="border p-3 mb-4">
                <div className="grid grid-cols-4 gap-4 text-xs">
                  <div>
                    <div className="font-bold">Tracking Number</div>
                    <div className="text-green-600 font-bold text-lg">{shipment.trackingNumber}</div>
                  </div>
                  <div>
                    <div className="font-bold">Service Type</div>
                    <div>{shipment.serviceType || 'Express'}</div>
                  </div>
                  <div>
                    <div className="font-bold">Mode</div>
                    <div>{shipment.mode || 'Air'}</div>
                  </div>
                  <div>
                    <div className="font-bold">Declared Value</div>
                    <div>KES {parseFloat(shipment.declaredValue || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Package Details */}
              <div className="border p-3 mb-4">
                <div className="font-bold text-xs mb-2">PACKAGE DETAILS</div>
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div>
                    <div className="font-bold">Pieces</div>
                    <div>{shipment.numberOfPackages || 1}</div>
                  </div>
                  <div>
                    <div className="font-bold">Actual Weight</div>
                    <div>{shipment.weight || '0.50'} KG</div>
                  </div>
                  <div>
                    <div className="font-bold">Chargeable Weight</div>
                    <div>{shipment.chargeableWeight || shipment.weight || '0.50'} KG</div>
                  </div>
                  <div>
                    <div className="font-bold">Dimensions</div>
                    <div>{shipment.dimensions || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-bold">CBM</div>
                    <div>{shipment.cbm || '0.00'} m³</div>
                  </div>
                </div>
              </div>

              {/* Date & Time Information */}
              <div className="border p-3 mb-4 bg-gray-50">
                <div className="font-bold text-xs mb-2">SHIPMENT DATES & TIMES</div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="font-bold text-gray-600">Created Date</div>
                    <div className="text-gray-800">{shipment.createdAt ? formatDateOnly(shipment.createdAt, getUserTimezone()) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-600">Created Time</div>
                    <div className="text-gray-800">{shipment.createdAt ? formatTimeOnly(shipment.createdAt, getUserTimezone()) : 'N/A'}</div>
                  </div>
                  <div>
                    <div className="font-bold text-gray-600">Last Updated</div>
                    <div className="text-gray-800">{shipment.updatedAt ? formatTimeOnly(shipment.updatedAt, getUserTimezone()) : 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* QR Code */}
              <div className="text-center mb-4">
                <canvas ref={qrCodeRef}></canvas>
              </div>

              {/* Description - Matches Admin Dashboard Format */}
              <div className="border p-3 text-xs">
                <div className="font-bold mb-2">Description of Goods/Items/Contents Code</div>
                <div className="mb-2">
                  {enhancedShipment?.packageDescription || enhancedShipment?.description || shipment?.packageName || 'As Per Invoice'}
                </div>

                {enhancedShipment?.note && (
                  <>
                    <div className="font-bold mb-1">Note</div>
                    <div className="mb-2">
                      {enhancedShipment.note}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t p-4 flex gap-2 justify-end">
              <Button
                onClick={printWaybill}
                variant="outline"
                className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
              >
                <Printer className="w-4 h-4" />
                Print
              </Button>
              <Button
                onClick={downloadWaybill}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

