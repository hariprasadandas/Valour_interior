import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import PageShell from './PageShell.jsx'
import Logo from '../assets/VTlogo.jpg'

const convertImageToDataUrl = async (src) => {
  const response = await fetch(src)
  if (!response.ok) {
    throw new Error('Unable to fetch logo asset')
  }
  const blob = await response.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read logo blob'))
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

const formatCurrency = (value = 0) => {
  const numericValue = Number.isFinite(Number(value))
    ? Number(value)
    : 0
  // Format with up to 2 decimal places, but preserve exact decimals
  const formatted = numericValue.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
  return `₹${formatted}`
}

const extractNumericValue = (value) => {
  if (!value && value !== 0) return 0
  const digits = String(value).replace(/\D/g, '')
  const numeric = parseInt(digits, 10)
  return Number.isNaN(numeric) ? 0 : numeric
}

const numberToWords = (value) => {
  const units = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
  ]
  const teens = [
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]

  const convertTwoDigits = (num) => {
    if (num < 10) return units[num]
    if (num < 20) return teens[num - 10]
    const ten = Math.floor(num / 10)
    const unit = num % 10
    return [tens[ten], units[unit]].filter(Boolean).join(' ')
  }

  const convertThreeDigits = (num) => {
    const hundred = Math.floor(num / 100)
    const remainder = num % 100
    const parts = []
    if (hundred) {
      parts.push(`${units[hundred]} Hundred`)
    }
    if (remainder) {
      parts.push(convertTwoDigits(remainder))
    }
    return parts.join(' ')
  }

  const scales = [
    { value: 10000000, label: 'Crore' },
    { value: 100000, label: 'Lakh' },
    { value: 1000, label: 'Thousand' },
    { value: 100, label: 'Hundred' },
  ]

  if (value === 0) {
    return 'Zero'
  }

  let num = value
  const words = []

  for (const scale of scales) {
    if (num >= scale.value) {
      const count = Math.floor(num / scale.value)
      words.push(`${numberToWords(count)} ${scale.label}`)
      num %= scale.value
    }
  }

  if (num > 0) {
    if (num < 100) {
      words.push(convertTwoDigits(num))
    } else {
      words.push(convertThreeDigits(num))
    }
  }

  return words.join(' ')
}

const amountToWords = (amount) => {
  const [rupeesPart, paisePart] = amount.toFixed(2).split('.')
  const rupees = parseInt(rupeesPart, 10)
  const paise = parseInt(paisePart, 10)

  const rupeeWords = `${numberToWords(rupees)} Rupees`
  const paiseWords = paise ? ` and ${numberToWords(paise)} Paise` : ''

  return `${rupeeWords}${paiseWords} Only`
}

const formatDateWithOrdinal = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date()
  const day = date.getDate()
  const suffix = (d) => {
    if (d >= 11 && d <= 13) return 'th'
    switch (d % 10) {
      case 1:
        return 'st'
      case 2:
        return 'nd'
      case 3:
        return 'rd'
      default:
        return 'th'
    }
  }
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${String(day).padStart(2, '0')}${suffix(day)} ${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

const COMPANY_DETAILS = {
  name: 'Valour Interior Studio',
  brandLine: 'Luxury interiors & turnkey solutions',
  contactLine: 'valourtechnologiesuk@gmail.com  •  +91 9515272424  •  www.valourtechnologies.com',
  addressLine: 'Hyderabad, Telangana, India',
  gstNumber: '36BJPP4058J1ZZ',
}

const MIN_QUOTE_NUMBER = 1000

const Quotations = () => {
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    gstin: '',
  })

  const [projectName, setProjectName] = useState('')
  const [items, setItems] = useState([
    { id: 1, category: '', description: '', quantity: 1, unitPrice: 0 },
  ])

  const [quotationNumber, setQuotationNumber] = useState('')
  const [nextQuoteNumber, setNextQuoteNumber] = useState(MIN_QUOTE_NUMBER)
  const [quotationDate, setQuotationDate] = useState(
    new Date().toISOString().split('T')[0],
  )
  const [validity, setValidity] = useState(30)
  const [taxRate, setTaxRate] = useState(18)
  const [saving, setSaving] = useState(false)
  const [generatingPDF, setGeneratingPDF] = useState(false)
  const [logoDataUrl, setLogoDataUrl] = useState(null)
  
  // Autocomplete state
  const [categorySuggestions, setCategorySuggestions] = useState({})
  const [descriptionSuggestions, setDescriptionSuggestions] = useState({})
  const [showCategoryDropdown, setShowCategoryDropdown] = useState({})
  const [showDescriptionDropdown, setShowDescriptionDropdown] = useState({})

  useEffect(() => {
    let isMounted = true

    const loadLogo = async () => {
      try {
        const dataUrl = await convertImageToDataUrl(Logo)
        if (isMounted) {
          setLogoDataUrl(dataUrl)
        }
      } catch (error) {
        console.error('[Quotations] Unable to preload logo for PDF:', error)
      }
    }

    loadLogo()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const fetchLatestQuotationNumber = async () => {
      try {
        const response = await fetch('/api/quotes')
        if (!response.ok) {
          throw new Error('Failed to fetch existing quotations')
        }

        const quotes = await response.json()
        const highestNumber = quotes.reduce(
          (max, quote) =>
            Math.max(max, extractNumericValue(quote.quotationNumber)),
          MIN_QUOTE_NUMBER - 1,
        )
        const computedNext = Math.max(MIN_QUOTE_NUMBER, highestNumber + 1)

        if (isMounted) {
          setNextQuoteNumber(computedNext)
          setQuotationNumber((current) =>
            current?.trim() ? current : String(computedNext),
          )
        }
      } catch (error) {
        console.error('[Quotations] Unable to load latest quotation number:', error)
        if (isMounted) {
          setQuotationNumber((current) =>
            current?.trim() ? current : String(MIN_QUOTE_NUMBER),
          )
        }
      }
    }

    fetchLatestQuotationNumber()

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch autocomplete suggestions
  const fetchSuggestions = async (type, searchTerm, itemId) => {
    if (!searchTerm || searchTerm.trim().length < 1) {
      if (type === 'categories') {
        setCategorySuggestions((prev) => ({ ...prev, [itemId]: [] }))
      } else {
        setDescriptionSuggestions((prev) => ({ ...prev, [itemId]: [] }))
      }
      return
    }

    try {
      const response = await fetch(
        `/api/quotes/items?type=${type}&search=${encodeURIComponent(searchTerm)}`,
      )
      if (response.ok) {
        const data = await response.json()
        if (type === 'categories') {
          setCategorySuggestions((prev) => ({ ...prev, [itemId]: data.items || [] }))
        } else {
          setDescriptionSuggestions((prev) => ({ ...prev, [itemId]: data.items || [] }))
        }
      }
    } catch (error) {
      console.error(`[Quotations] Failed to fetch ${type}:`, error)
    }
  }

  const resolvedQuotationNumber =
    quotationNumber.trim() ||
    (nextQuoteNumber ? String(nextQuoteNumber) : String(MIN_QUOTE_NUMBER))

  const handleQuotationNumberChange = (value) => {
    setQuotationNumber(value)
    const numericValue = extractNumericValue(value)
    if (numericValue >= MIN_QUOTE_NUMBER) {
      setNextQuoteNumber(numericValue)
    }
  }

  const bumpQuotationNumber = (baseValue) => {
    const numeric = Math.max(
      extractNumericValue(baseValue),
      MIN_QUOTE_NUMBER - 1,
    )
    const nextValue = numeric + 1
    setNextQuoteNumber(nextValue)
    setQuotationNumber(String(nextValue))
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        category: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
      },
    ])
  }

  const removeItem = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id))
    }
  }

  const updateItem = (id, field, value) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    )
    
    // Fetch suggestions when category or description changes
    if (field === 'category') {
      fetchSuggestions('categories', value, id)
      setShowCategoryDropdown((prev) => ({ ...prev, [id]: true }))
    } else if (field === 'description') {
      fetchSuggestions('descriptions', value, id)
      setShowDescriptionDropdown((prev) => ({ ...prev, [id]: true }))
    }
  }
  
  const selectSuggestion = (itemId, field, value) => {
    updateItem(itemId, field, value)
    setShowCategoryDropdown((prev) => ({ ...prev, [itemId]: false }))
    setShowDescriptionDropdown((prev) => ({ ...prev, [itemId]: false }))
  }

  const calculateItemTotal = (item) => {
    return item.quantity * item.unitPrice
  }

  const calculateSubtotal = () => {
    return items.reduce(
      (sum, item) => sum + calculateItemTotal(item),
      0,
    )
  }

  const calculateTax = () => {
    return (calculateSubtotal() * taxRate) / 100
  }

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax()
  }

  const validateQuotation = () => {
    if (!customer.name.trim()) {
      alert('Please enter customer name.')
      return false
    }
    if (items.some((item) => !item.category.trim())) {
      alert('Please enter category for all items.')
      return false
    }
    if (items.some((item) => !item.description.trim())) {
      alert('Please fill in all item descriptions.')
      return false
    }
    if (items.some((item) => item.quantity <= 0 || item.unitPrice <= 0)) {
      alert('Please ensure all items have valid quantity and price.')
      return false
    }
    return true
  }

  const fetchQuoteByNumber = async (quoteNumber) => {
    try {
      const response = await fetch('/api/quotes')
      if (!response.ok) {
        throw new Error('Failed to fetch quotations')
      }
      const quotes = await response.json()
      return quotes.find(
        (quote) => String(quote.quotationNumber) === String(quoteNumber),
      )
    } catch (error) {
      console.error('[Quotations] Unable to fetch quote by number:', error)
      return null
    }
  }

  const generatePDF = async () => {
    if (!validateQuotation()) {
      return
    }

    setGeneratingPDF(true)
    let saveSuccess = false
    let persistedQuote = null
    let payload = null
    const sanitizedItems = items.map(
      ({ category, description, quantity, unitPrice }) => ({
        category: category.trim(),
        description: description.trim(),
        quantity,
        unitPrice,
      }),
    )

    try {
      payload = {
        quotationNumber: resolvedQuotationNumber,
        customer: {
          ...customer,
          name: customer.name.trim(),
        },
        projectName: projectName.trim(),
        amount: calculateTotal(),
        items: sanitizedItems,
        status: 'Created',
        quotationDate: new Date(quotationDate).toISOString(),
        deliveredOn: null,
        validityDays: parseInt(validity, 10) || 0,
        taxRate: parseFloat(taxRate) || 0,
      }

      try {
        const response = await fetch('/api/quotes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })

        const data = await response.json().catch(() => ({}))
        if (!response.ok) {
          if (response.status === 409) {
            saveSuccess = true
            console.log('[Quotations] Quotation already exists in database')
            persistedQuote =
              (await fetchQuoteByNumber(resolvedQuotationNumber)) || null
          } else {
            throw new Error(
              data.message || 'Failed to save quotation to database.',
            )
          }
        } else {
          saveSuccess = true
          persistedQuote = data
        }
      } catch (error) {
        console.error('[Quotations] Save error during PDF generation:', error)
      }

      const sourceQuote = persistedQuote || payload
      const sanitizedCustomer = {
        ...sourceQuote.customer,
        name: sourceQuote.customer?.name?.trim() || '',
      }
      const sanitizedProjectName = sourceQuote.projectName?.trim() || ''
      const validityDays = parseInt(sourceQuote.validityDays, 10) || 0
      const pdfTaxRate = Number(sourceQuote.taxRate ?? taxRate) || 0
      const quotationDateForPdf = sourceQuote.quotationDate
        ? new Date(sourceQuote.quotationDate)
        : new Date(quotationDate)
      const validUntil = new Date(quotationDateForPdf)
      validUntil.setDate(validUntil.getDate() + validityDays)

      const itemsForPdf =
        Array.isArray(sourceQuote.items) && sourceQuote.items.length > 0
          ? sourceQuote.items
          : sanitizedItems

      let resolvedLogo = logoDataUrl
      if (!resolvedLogo) {
        try {
          resolvedLogo = await convertImageToDataUrl(Logo)
          setLogoDataUrl(resolvedLogo)
        } catch (error) {
          console.error('[Quotations] Unable to attach logo to PDF:', error)
        }
      }

      const doc = new jsPDF()
      doc.setLineWidth(0.1)
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 18
      const tableWidth = pageWidth - margin * 2

      // Calculate column widths to fit within table width without overlapping
      // A4 page width is ~210mm, with 18mm margins = 174mm available
      // Distribute columns proportionally
      const serialColumnWidth = 12
      const categoryColumnWidth = 38
      const qtyColumnWidth = 20
      const unitPriceColumnWidth = 32
      const amountColumnWidth = 35
      // Description gets remaining space
      const descriptionColumnWidth = Math.max(
        tableWidth -
          (serialColumnWidth +
            categoryColumnWidth +
            qtyColumnWidth +
            unitPriceColumnWidth +
            amountColumnWidth),
        55,
      )

      const columnBoundaries = [
        margin,
        margin + serialColumnWidth,
        margin + serialColumnWidth + categoryColumnWidth,
        margin + serialColumnWidth + categoryColumnWidth + descriptionColumnWidth,
        margin +
          serialColumnWidth +
          categoryColumnWidth +
          descriptionColumnWidth +
          qtyColumnWidth,
        margin +
          serialColumnWidth +
          categoryColumnWidth +
          descriptionColumnWidth +
          qtyColumnWidth +
          unitPriceColumnWidth,
        margin + tableWidth,
      ]

      const columnCenters = {
        serial: (columnBoundaries[0] + columnBoundaries[1]) / 2,
        category: (columnBoundaries[1] + columnBoundaries[2]) / 2,
        quantity: (columnBoundaries[3] + columnBoundaries[4]) / 2,
      }
      // Ensure description starts after category with proper spacing
      const descriptionTextX = columnBoundaries[2] + 2
      // Unit price and amount should be right-aligned within their columns
      const unitPriceTextX = columnBoundaries[5] - 3
      const amountTextX = columnBoundaries[6] - 3

      const drawColumnGrid = (startY, height) => {
        columnBoundaries.slice(1, -1).forEach((xPosition) => {
          doc.line(xPosition, startY, xPosition, startY + height)
        })
      }

      let yPos = 55

      // Brand banner
      doc.setFillColor(15, 23, 42)
      doc.rect(0, 0, pageWidth, 42, 'F')
      if (resolvedLogo) {
        doc.addImage(resolvedLogo, 'WEBP', margin, 7, 28, 28)
      }

      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text(COMPANY_DETAILS.name, margin + 36, 18)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(COMPANY_DETAILS.brandLine, margin + 36, 28)
      doc.setFontSize(9)
      doc.text(COMPANY_DETAILS.contactLine, pageWidth - margin, 33, {
        align: 'right',
      })
      doc.text(`GSTIN: ${COMPANY_DETAILS.gstNumber}`, pageWidth - margin, 40, {
        align: 'right',
      })

      doc.setTextColor(51, 65, 85)
      doc.setFontSize(11)

      // Overview band
      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, yPos - 14, tableWidth, 30, 4, 4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.text('Quotation Overview', margin + 4, yPos - 4)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text(`Quotation #: ${resolvedQuotationNumber}`, margin + 4, yPos + 2)
      doc.text(
        `Date: ${formatDateWithOrdinal(quotationDateForPdf)}`,
        pageWidth / 2,
        yPos + 2,
      )
      doc.text(
        `Valid Until: ${formatDateWithOrdinal(validUntil)}`,
        margin + 4,
        yPos + 10,
      )
      doc.text(
        sanitizedProjectName
          ? `Project: ${sanitizedProjectName}`
          : 'Prepared by: Valour Interior Studio',
        pageWidth / 2,
        yPos + 10,
      )
      yPos += 32

      // Client details
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text('Client Details', margin, yPos)
      yPos += 6

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const clientLines = [
        sanitizedCustomer.name,
        sanitizedCustomer.email
          ? `Email: ${sanitizedCustomer.email}`
          : null,
        sanitizedCustomer.phone
          ? `Phone: ${sanitizedCustomer.phone}`
          : null,
        sanitizedCustomer.gstin
          ? `GSTIN: ${sanitizedCustomer.gstin}`
          : null,
        sanitizedCustomer.address || null,
        [
          sanitizedCustomer.city,
          sanitizedCustomer.state,
          sanitizedCustomer.pincode,
        ]
          .filter(Boolean)
          .join(', ') || null,
      ].filter(Boolean)

      clientLines.forEach((line) => {
        doc.text(line, margin, yPos)
        yPos += 5
      })
      yPos += 8

      // Items table
      const headerHeight = 10
      const resetTableHeader = () => {
        doc.setFillColor(249, 115, 22)
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.rect(margin, yPos, tableWidth, headerHeight, 'F')
        doc.text('S.No', columnCenters.serial, yPos + 6, { align: 'center' })
        doc.text('Category', columnCenters.category, yPos + 6, {
          align: 'center',
        })
        doc.text('Description', descriptionTextX, yPos + 6)
        doc.text('Qty', columnCenters.quantity, yPos + 6, { align: 'center' })
        doc.text('Unit Price', unitPriceTextX, yPos + 6, { align: 'right' })
        doc.text('Amount', amountTextX, yPos + 6, { align: 'right' })
        drawColumnGrid(yPos, headerHeight)
        yPos += headerHeight
        doc.setTextColor(15, 23, 42)
        doc.setFont('helvetica', 'normal')
      }

      const baseRowHeight = 8
      doc.setDrawColor(226, 232, 240)
      resetTableHeader()

      // Format currency for PDF without superscript issues - use plain text formatting
      const formatCurrencyForPDF = (val) => {
        const num = Number.isFinite(Number(val)) ? Number(val) : 0
        const formatted = num.toLocaleString('en-IN', {
          minimumFractionDigits: num % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2,
        })
        return `Rs. ${formatted}`
      }

      doc.setFontSize(9)
      itemsForPdf.forEach((item, index) => {
        const descriptionText = item.description?.trim() || '-'
        const categoryText = item.category?.trim() || '-'
        
        // Wrap category text to prevent overflow
        const wrappedCategory = doc.splitTextToSize(
          categoryText,
          categoryColumnWidth - 4,
        )
        
        const wrappedDescription = doc.splitTextToSize(
          descriptionText,
          descriptionColumnWidth - 4,
        )
        const textBlockHeight = Math.max(
          wrappedDescription.length * 3 + 2,
          wrappedCategory.length * 3 + 2,
        )
        const rowHeight = Math.max(baseRowHeight, textBlockHeight)

        if (yPos > pageHeight - margin - rowHeight) {
          doc.addPage()
          yPos = margin
          resetTableHeader()
        }

        const [fillR, fillG, fillB] =
          index % 2 === 0 ? [255, 255, 255] : [248, 250, 252]
        doc.setFillColor(fillR, fillG, fillB)
        doc.rect(margin, yPos, tableWidth, rowHeight, 'F')
        doc.rect(margin, yPos, tableWidth, rowHeight)
        drawColumnGrid(yPos, rowHeight)

        doc.text(String(index + 1), columnCenters.serial, yPos + 6, {
          align: 'center',
        })
        
        // Render category text with wrapping
        let categoryY = yPos + 5
        wrappedCategory.forEach((line) => {
          doc.text(line, columnCenters.category, categoryY, {
            align: 'center',
          })
          categoryY += 3
        })

        // Render description text
        let textY = yPos + 5
        wrappedDescription.forEach((line) => {
          doc.text(line, descriptionTextX, textY)
          textY += 3
        })

        // Format numbers without rounding, preserving exact decimals
        const quantityValue = Number(item.quantity || 0)
        const unitPriceValue = Number(item.unitPrice || 0)
        const itemTotal = quantityValue * unitPriceValue
        
        // Format quantity - preserve decimals if present
        const quantityText = quantityValue % 1 === 0 
          ? quantityValue.toString() 
          : quantityValue.toFixed(2)

        doc.text(quantityText, columnCenters.quantity, yPos + 6, {
          align: 'center',
        })
        doc.text(formatCurrencyForPDF(unitPriceValue), unitPriceTextX, yPos + 6, {
          align: 'right',
        })
        doc.text(formatCurrencyForPDF(itemTotal), amountTextX, yPos + 6, {
          align: 'right',
        })
        yPos += rowHeight
      })

      yPos += 12

      // Totals block
      const computeItemTotal = (itemData) =>
        Number(itemData.quantity || 0) * Number(itemData.unitPrice || 0)
      const subtotal = itemsForPdf.reduce(
        (sum, itemData) => sum + computeItemTotal(itemData),
        0,
      )
      const tax = (subtotal * pdfTaxRate) / 100
      const total = subtotal + tax
      const summaryHeight = 36

      doc.setFillColor(248, 250, 252)
      doc.roundedRect(margin, yPos, tableWidth, summaryHeight, 4, 4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.text('Investment Summary', margin + 4, yPos + 8)
      doc.setFont('helvetica', 'normal')
      doc.text('Subtotal', pageWidth - margin - 60, yPos + 14)
      doc.text(formatCurrencyForPDF(subtotal), amountTextX, yPos + 14, {
        align: 'right',
      })
      doc.text(`GST (${pdfTaxRate}%)`, pageWidth - margin - 60, yPos + 22)
      doc.text(formatCurrencyForPDF(tax), amountTextX, yPos + 22, {
        align: 'right',
      })
      doc.setFont('helvetica', 'bold')
      doc.text('Grand Total', pageWidth - margin - 60, yPos + 30)
      doc.text(formatCurrencyForPDF(total), amountTextX, yPos + 30, {
        align: 'right',
      })

      yPos += summaryHeight + 8
      const wordsBoxHeight = 18
      if (yPos > pageHeight - margin - wordsBoxHeight - 12) {
        doc.addPage()
        yPos = margin
      }

      // Use exact total without rounding for amount in words
      const totalForWords = total
      const amountInWords = doc.splitTextToSize(
        amountToWords(totalForWords),
        tableWidth - 90,
      )
      doc.setDrawColor(226, 232, 240)
      doc.rect(margin, yPos, tableWidth, wordsBoxHeight)
      doc.setFont('helvetica', 'bold')
      doc.text('Total (in words)', margin + 4, yPos + 11)
      doc.setFont('helvetica', 'normal')
      doc.text(amountInWords, margin + 60, yPos + 11)
      yPos += wordsBoxHeight + 10

      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.text(
        'Prepared by Valour Interior Studio • valourtechnologiesuk@gmail.com • +91 9515272424',
        margin,
        yPos,
      )

      const fileName = `Quotation_${sanitizedCustomer.name.replace(
        /\s+/g,
        '_',
      )}_${Date.now()}.pdf`
      doc.save(fileName)

      if (saveSuccess) {
        alert(
          'PDF generated and quotation saved to MongoDB database successfully!',
        )
        bumpQuotationNumber(resolvedQuotationNumber)
      } else {
        alert(
          'PDF generated successfully, but there was an issue saving to database. Please try saving manually.',
        )
      }
    } catch (error) {
      console.error('[Quotations] PDF generation error:', error)
      alert('Unable to generate the PDF right now. Please try again shortly.')
    } finally {
      setGeneratingPDF(false)
    }
  }

  const handleSaveQuotation = async () => {
    if (!validateQuotation()) {
      return
    }

    const sanitizedItems = items.map(
      ({ category, description, quantity, unitPrice }) => ({
        category: category.trim(),
        description: description.trim(),
        quantity,
        unitPrice,
      }),
    )

    const payload = {
      quotationNumber: resolvedQuotationNumber,
      customer: {
        ...customer,
        name: customer.name.trim(),
      },
      projectName: projectName.trim(),
      amount: calculateTotal(),
      items: sanitizedItems,
      status: 'Created',
      quotationDate: new Date(quotationDate).toISOString(),
      deliveredOn: null,
      validityDays: parseInt(validity, 10) || 0,
      taxRate: parseFloat(taxRate) || 0,
    }

    try {
      setSaving(true)
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Failed to save quotation to database.')
      }

      // Success - show confirmation
      alert('Quotation saved to MongoDB database successfully!')
      bumpQuotationNumber(resolvedQuotationNumber)
      
      // Optionally reset form after successful save
      // Uncomment the following lines if you want to reset the form:
      // setCustomer({ name: '', email: '', phone: '', address: '', city: '', state: '', pincode: '' })
      // setProjectName('')
      // setItems([{ id: 1, description: '', quantity: 1, unitPrice: 0 }])
      // setQuotationNumber('')
    } catch (error) {
      console.error('[Quotations] Save error:', error)
      alert(error.message || 'Unable to save quotation to database. Please check your connection and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageShell
      title="Generate Quotation"
      description="Create and download professional quotations for your customers"
    >
      <div className="space-y-8">
        {/* Customer Details */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Customer Details
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-900">
              Customer Name *
              <input
                type="text"
                value={customer.name}
                onChange={(e) =>
                  setCustomer({ ...customer, name: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="John Doe"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Email
              <input
                type="email"
                value={customer.email}
                onChange={(e) =>
                  setCustomer({ ...customer, email: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="john@example.com"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Phone
              <input
                type="tel"
                value={customer.phone}
                onChange={(e) =>
                  setCustomer({ ...customer, phone: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="+91 98765 43210"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Address
              <input
                type="text"
                value={customer.address}
                onChange={(e) =>
                  setCustomer({ ...customer, address: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="Street address"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              City
              <input
                type="text"
                value={customer.city}
                onChange={(e) =>
                  setCustomer({ ...customer, city: e.target.value })
                }
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="Mumbai"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="text-sm font-semibold text-slate-900">
                State
                <input
                  type="text"
                  value={customer.state}
                  onChange={(e) =>
                    setCustomer({ ...customer, state: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Maharashtra"
                />
              </label>
              <label className="text-sm font-semibold text-slate-900">
                Pincode
                <input
                  type="text"
                  value={customer.pincode}
                  onChange={(e) =>
                    setCustomer({ ...customer, pincode: e.target.value })
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="400001"
                />
              </label>
            </div>
            <label className="text-sm font-semibold text-slate-900 md:col-span-2">
              Customer GST IN
              <input
                type="text"
                value={customer.gstin}
                onChange={(e) => setCustomer({ ...customer, gstin: e.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="36BJPP4058J1ZZ"
              />
            </label>
          </div>
        </section>

        {/* Quotation Settings */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Quotation Settings
          </h2>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-sm font-semibold text-slate-900">
              Quotation Number
              <input
                type="text"
                value={quotationNumber}
                onChange={(e) => handleQuotationNumberChange(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                inputMode="numeric"
                placeholder="1000"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Date
              <input
                type="date"
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Validity (days)
              <input
                type="number"
                value={validity}
                onChange={(e) => setValidity(e.target.value)}
                min="1"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900">
              Tax Rate (%)
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                min="0"
                max="100"
                step="0.01"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              />
            </label>
            <label className="text-sm font-semibold text-slate-900 md:col-span-2">
              Project / Brief
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="Ex: Sample Apartment FF&E"
              />
            </label>
          </div>
        </section>

        {/* Items */}
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Items</h2>
            <button
              type="button"
              onClick={addItem}
              className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-orange-600"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-[1.2fr_2fr_0.8fr_1fr_1fr_auto]"
              >
                <div className="md:col-span-full text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Item #{index + 1}
                </div>
                <label className="text-sm font-semibold text-slate-900 relative">
                  Category *
                  <div className="relative">
                    <input
                      type="text"
                      value={item.category}
                      onChange={(e) =>
                        updateItem(item.id, 'category', e.target.value)
                      }
                      onFocus={() =>
                        setShowCategoryDropdown((prev) => ({ ...prev, [item.id]: true }))
                      }
                      onBlur={() => {
                        // Delay hiding dropdown to allow click on suggestion
                        setTimeout(() => {
                          setShowCategoryDropdown((prev) => ({ ...prev, [item.id]: false }))
                        }, 200)
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="Furniture"
                    />
                    {showCategoryDropdown[item.id] &&
                      categorySuggestions[item.id] &&
                      categorySuggestions[item.id].length > 0 && (
                        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                          {categorySuggestions[item.id].map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => selectSuggestion(item.id, 'category', suggestion)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-900 hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </label>
                <label className="text-sm font-semibold text-slate-900 relative">
                  Description *
                  <div className="relative">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        updateItem(item.id, 'description', e.target.value)
                      }
                      onFocus={() =>
                        setShowDescriptionDropdown((prev) => ({ ...prev, [item.id]: true }))
                      }
                      onBlur={() => {
                        // Delay hiding dropdown to allow click on suggestion
                        setTimeout(() => {
                          setShowDescriptionDropdown((prev) => ({ ...prev, [item.id]: false }))
                        }, 200)
                      }}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                      placeholder="Item description"
                    />
                    {showDescriptionDropdown[item.id] &&
                      descriptionSuggestions[item.id] &&
                      descriptionSuggestions[item.id].length > 0 && (
                        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                          {descriptionSuggestions[item.id].map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => selectSuggestion(item.id, 'description', suggestion)}
                              className="w-full px-3 py-2 text-left text-sm text-slate-900 hover:bg-orange-50 focus:bg-orange-50 focus:outline-none"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                </label>
                <label className="text-sm font-semibold text-slate-900">
                  Quantity *
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        'quantity',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-900">
                  Unit Price (₹) *
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        'unitPrice',
                        parseFloat(e.target.value) || 0,
                      )
                    }
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                  />
                </label>
                <div className="flex items-end">
                  <div className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900">
                    {formatCurrency(calculateItemTotal(item))}
                  </div>
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Summary */}
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Summary
          </h2>
          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-4 text-sm text-slate-600">
              <span>Subtotal:</span>
              <span className="w-32 text-left font-semibold">
                {formatCurrency(calculateSubtotal())}
              </span>
            </div>
            <div className="flex justify-end gap-4 text-sm text-slate-600">
              <span>GST ({taxRate}%):</span>
              <span className="w-32 text-left font-semibold">
                {formatCurrency(calculateTax())}
              </span>
            </div>
            <div className="flex justify-end gap-4 border-t border-slate-300 pt-2 text-base text-slate-900">
              <span className="font-semibold">Total:</span>
              <span className="w-32 text-left text-lg font-bold">
                {formatCurrency(calculateTotal())}
              </span>
            </div>
          </div>
        </section>

        {/* Generate PDF Button */}
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleSaveQuotation}
            disabled={saving}
            className="rounded-full border border-slate-200 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-slate-900 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save to History'}
          </button>
          <button
            type="button"
            onClick={generatePDF}
            disabled={generatingPDF}
            className="rounded-full bg-slate-900 px-8 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generatingPDF ? 'Saving & Generating PDF...' : 'Generate & Download PDF'}
          </button>
        </div>
      </div>
    </PageShell>
  )
}

export default Quotations

