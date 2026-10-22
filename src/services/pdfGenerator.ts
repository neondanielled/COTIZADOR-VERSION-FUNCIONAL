import { jsPDF } from 'jspdf';
import { SavedQuote } from '../types/quote';
import { formatARS } from '../utils/currency';
import { getBusinessLogo } from './imageStorage';

/**
 * Generates an executive, professional, vector A4 PDF proposal for the client.
 * Strictly compliant with client-facing requirements:
 * - Real workshop logo/profile picture with preserved aspect ratio
 * - No internal status labels in the header
 * - Exclusively 4 technical specifications: Medidas, Base, Fuente, Instalación
 * - Preserved proportional vector sign diagram with visual cm dimensions
 * - Complete removal of the internal manufacturing/provision table and raw consumption metrics
 * - Prominent 3-card financial block: Total ARS, Seña para fabricación (%) and Saldo pendiente
 * - Clear commercial terms, deposit instructions, payment methods and warranty conditions
 */
export async function generateQuotePDF(quote: SavedQuote, openInNewTab: boolean = false): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm

  // Corporate Color Palette (RGB)
  const cDarkNavy = [15, 23, 42]; // Slate 900
  const cCyan = [6, 182, 212]; // Cyan 500
  const cCyanDark = [14, 116, 144]; // Cyan 700
  const cTextMuted = [100, 116, 139]; // Slate 500
  const cTextDark = [15, 23, 42];
  const cBgLight = [248, 250, 252]; // Slate 50
  const cBgCard = [241, 245, 249]; // Slate 100
  const cBorder = [226, 232, 240]; // Slate 200

  // Date formatting
  const formattedDate = new Date(quote.createdAt).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  // Calculate Seña and Saldo
  const depositPercentage =
    typeof quote.businessSnapshot.depositPercentage === 'number' &&
    quote.businessSnapshot.depositPercentage >= 0 &&
    quote.businessSnapshot.depositPercentage <= 100
      ? quote.businessSnapshot.depositPercentage
      : 50;

  const finalPrice = quote.calculationResult.finalPrice;
  const depositAmount = Math.round(finalPrice * (depositPercentage / 100));
  const balanceAmount = Math.max(0, finalPrice - depositAmount);

  // Dimensions
  const wCm = typeof quote.formData.widthCm === 'number' && quote.formData.widthCm > 0 ? quote.formData.widthCm : 60;
  const hCm = typeof quote.formData.heightCm === 'number' && quote.formData.heightCm > 0 ? quote.formData.heightCm : 60;
  const envText = quote.formData.installationType === 'exterior' ? 'Apto exterior' : 'Uso interior';

  // Base description (Material and thickness only, no internal machining or tooling descriptions)
  let baseDescription = 'Sin base acrílica (montaje directo a pared)';
  if (quote.formData.hasAcrylic) {
    if (quote.calculationResult.acrylicDetail?.name) {
      // Clean any internal workshop tags if present
      baseDescription = quote.calculationResult.acrylicDetail.name
        .replace(/\(Mecanizado CNC\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
    } else {
      baseDescription = 'Acrílico cristal 3 mm';
    }
  }

  // Power supply brief description
  let powerSupplyDescription = 'Fuente switching 12V estabilizada';
  if (quote.calculationResult.powerSuppliesDetail && quote.calculationResult.powerSuppliesDetail.length > 0) {
    powerSupplyDescription = quote.calculationResult.powerSuppliesDetail.map((p) => p.name).join(', ');
  }

  // ==========================================
  // 1. TOP HEADER BRANDING BLOCK (0 to 30 mm)
  // ==========================================
  doc.setFillColor(cDarkNavy[0], cDarkNavy[1], cDarkNavy[2]);
  doc.rect(0, 0, pageWidth, 30, 'F');

  // Accent cyan bottom line
  doc.setFillColor(cCyan[0], cCyan[1], cCyan[2]);
  doc.rect(0, 29.2, pageWidth, 0.8, 'F');

  let brandStartX = margin;

  // Retrieve logo from snapshot or from IndexedDB storage
  let logoData = quote.businessSnapshot.logoDataUrl;
  if (!logoData) {
    try {
      logoData = (await getBusinessLogo(quote.ownerUid || 'local_user')) || undefined;
    } catch (e) {
      console.warn('Could not retrieve logo from storage:', e);
    }
  }

  // Render Workshop Logo if available
  if (logoData) {
    try {
      const maxLogoW = 32;
      const maxLogoH = 22;
      let logoW = 24;
      let logoH = 22;

      // Extract image properties if supported
      try {
        const props = doc.getImageProperties(logoData);
        if (props.width && props.height) {
          const aspect = props.width / props.height;
          if (aspect >= 1) {
            logoW = Math.min(maxLogoW, maxLogoH * aspect);
            logoH = logoW / aspect;
          } else {
            logoH = Math.min(maxLogoH, maxLogoW / aspect);
            logoW = logoH * aspect;
          }
        }
      } catch (err) {
        console.warn('Could not read image properties, using default box:', err);
      }

      const logoX = margin;
      const logoY = 4 + (22 - logoH) / 2;

      // White badge backdrop for crisp logo visibility
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(logoX - 1, 3.5, logoW + 2, 23, 1.5, 1.5, 'F');

      doc.addImage(
        logoData,
        'PNG',
        logoX,
        logoY,
        logoW,
        logoH,
        undefined,
        'FAST'
      );

      brandStartX = logoX + logoW + 5;
    } catch (e) {
      console.warn('Error embedding logo in PDF:', e);
      brandStartX = margin;
    }
  }

  // Workshop Trade Name & Subtitle
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const tradeName = quote.businessSnapshot.tradeName || 'Taller de Cartelería Neón';
  doc.text(tradeName, brandStartX, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225); // Slate 300
  const subBrand = quote.businessSnapshot.responsibleName
    ? `Responsable: ${quote.businessSnapshot.responsibleName} · Cartelería y Diseño Neón a Medida`
    : 'Fabricación y Diseño Profesional Neón a Medida';
  doc.text(subBrand, brandStartX, 18.5);

  doc.setFontSize(7.5);
  doc.setTextColor(cCyan[0], cCyan[1], cCyan[2]);
  doc.text('PROPUESTA COMERCIAL Y PRESUPUESTO TÉCNICO', brandStartX, 23.5);

  // Quote Reference and Date on Top Right (STATUS COMPLETELY REMOVED)
  const headerRightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(cCyan[0], cCyan[1], cCyan[2]);
  doc.text(quote.quoteNumber, headerRightX, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text(`Fecha: ${formattedDate}`, headerRightX, 20.5, { align: 'right' });

  // ==========================================
  // 2. WORKSHOP CONTACT BAR (y = 33 to 38 mm)
  // ==========================================
  let y = 34;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);

  const workshopInfo = [
    quote.businessSnapshot.whatsapp ? `WhatsApp: ${quote.businessSnapshot.whatsapp}` : null,
    quote.businessSnapshot.instagram ? `Instagram: ${quote.businessSnapshot.instagram}` : null,
    quote.businessSnapshot.city ? `Ciudad: ${quote.businessSnapshot.city}` : null,
    quote.businessSnapshot.address ? `Taller: ${quote.businessSnapshot.address}` : null,
    quote.businessSnapshot.website ? `Web: ${quote.businessSnapshot.website}` : null,
  ]
    .filter(Boolean)
    .join('   ·   ');

  if (workshopInfo) {
    doc.text(workshopInfo, margin, y);
    y += 4;
  }

  // Thin separator
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // ==========================================
  // 3. CLIENT & PROJECT OVERVIEW CARD (y = 42 to 66 mm)
  // ==========================================
  const clientBoxHeight = 23;
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.roundedRect(margin, y, contentWidth, clientBoxHeight, 2, 2, 'F');
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(margin, y, contentWidth, clientBoxHeight, 2, 2, 'S');

  // Left Column: Client Data
  const col1X = margin + 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cCyanDark[0], cCyanDark[1], cCyanDark[2]);
  doc.text('DATOS DEL CLIENTE', col1X, y + 5.5);

  doc.setFontSize(9.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(quote.clientSnapshot.name || 'Cliente Particular', col1X, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  const phoneText = quote.clientSnapshot.phone ? `WhatsApp / Tel: ${quote.clientSnapshot.phone}` : 'Teléfono no especificado';
  doc.text(phoneText, col1X, y + 16);

  const locText = [quote.clientSnapshot.city, quote.clientSnapshot.address].filter(Boolean).join(', ') || 'Entrega en taller';
  doc.text(locText, col1X, y + 20);

  // Right Column: Sign / Work Reference (NO m2 text)
  const col2X = margin + 96;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cCyanDark[0], cCyanDark[1], cCyanDark[2]);
  doc.text('PROYECTO / TRABAJO', col2X, y + 5.5);

  doc.setFontSize(9.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  const signTitle = quote.formData.signDescription || 'Cartel LED Neón Personalizado';
  const splitDesc = doc.splitTextToSize(signTitle, contentWidth - 100);
  doc.text(splitDesc.slice(0, 1), col2X, y + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text(`Medidas: ${wCm} cm × ${hCm} cm  ·  ${envText}`, col2X, y + 16);

  if (quote.formData.notes) {
    const obsText = doc.splitTextToSize(`Obs: ${quote.formData.notes}`, contentWidth - 100);
    doc.text(obsText.slice(0, 1), col2X, y + 20);
  }

  y += clientBoxHeight + 5;

  // ==========================================
  // 4. SPECS & PROPORTIONAL VECTOR DIAGRAM
  // EXCLUSIVELY 4 FIELDS: Medidas, Base, Fuente, Instalación
  // ==========================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cDarkNavy[0], cDarkNavy[1], cDarkNavy[2]);
  doc.text('ESPECIFICACIONES TÉCNICAS Y DIAGRAMA PROPORCIONAL', margin, y);
  y += 4;

  const specBoxHeight = 48;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(margin, y, contentWidth, specBoxHeight, 2, 2, 'S');

  // Specs text (Left side - strictly 4 fields)
  const specTextX = margin + 5;
  const specValX = margin + 28;
  let specY = y + 8;

  // 1. Medidas
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text('Medidas:', specTextX, specY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${wCm} cm × ${hCm} cm`, specValX, specY);
  specY += 9.5;

  // 2. Base
  doc.setFont('helvetica', 'bold');
  doc.text('Base:', specTextX, specY);
  doc.setFont('helvetica', 'normal');
  const splitBase = doc.splitTextToSize(baseDescription, 85);
  doc.text(splitBase.slice(0, 1), specValX, specY);
  specY += 9.5;

  // 3. Fuente
  doc.setFont('helvetica', 'bold');
  doc.text('Fuente:', specTextX, specY);
  doc.setFont('helvetica', 'normal');
  const splitPs = doc.splitTextToSize(powerSupplyDescription, 85);
  doc.text(splitPs.slice(0, 1), specValX, specY);
  specY += 9.5;

  // 4. Instalación
  doc.setFont('helvetica', 'bold');
  doc.text('Instalación:', specTextX, specY);
  doc.setFont('helvetica', 'normal');
  doc.text(envText, specValX, specY);

  // Proportional Vector Diagram (Right side)
  const diagBoxX = margin + 118;
  const diagBoxY = y + 5;
  const maxDiagW = 58;
  const maxDiagH = 38;

  const ratio = wCm / hCm;
  let dw = maxDiagW;
  let dh = dw / ratio;
  if (dh > maxDiagH) {
    dh = maxDiagH;
    dw = dh * ratio;
  }

  const drawX = diagBoxX + (maxDiagW - dw) / 2;
  const drawY = diagBoxY + (maxDiagH - dh) / 2;

  // Acrylic base silhouette
  doc.setFillColor(cDarkNavy[0], cDarkNavy[1], cDarkNavy[2]);
  doc.roundedRect(drawX, drawY, dw, dh, 1.5, 1.5, 'F');
  doc.setDrawColor(cCyan[0], cCyan[1], cCyan[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(drawX, drawY, dw, dh, 1.5, 1.5, 'S');

  // Simulated illuminated neon silhouette
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.roundedRect(drawX + dw * 0.12, drawY + dh * 0.18, dw * 0.76, dh * 0.64, 1.2, 1.2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(255, 255, 255);
  doc.text('LED NEÓN FLEX', drawX + dw / 2, drawY + dh / 2 + 1, { align: 'center' });

  // Dimension indicators (cotas)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(`${wCm} cm`, drawX + dw / 2, drawY - 2, { align: 'center' });
  doc.text(`${hCm} cm`, drawX + dw + 2.5, drawY + dh / 2 + 1);

  y += specBoxHeight + 6;

  // =========================================================================
  // 5. FINANCIAL BREAKDOWN BLOCK: TOTAL, SEÑA REQUERIDA & SALDO PENDIENTE
  // (Replaced the internal manufacturing / provision table with prominent economics)
  // =========================================================================
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cDarkNavy[0], cDarkNavy[1], cDarkNavy[2]);
  doc.text('RESUMEN ECONÓMICO Y CONDICIONES DE PAGO', margin, y);
  y += 4;

  const finCardH = 26;
  const colW = (contentWidth - 6) / 3; // 3 columns with 3mm gap

  // Card 1: TOTAL PRESUPUESTO
  const card1X = margin;
  doc.setFillColor(cDarkNavy[0], cDarkNavy[1], cDarkNavy[2]);
  doc.roundedRect(card1X, y, colW, finCardH, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text('TOTAL DE LA PROPUESTA', card1X + 5, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(255, 255, 255);
  doc.text(formatARS(finalPrice), card1X + 5, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184); // Slate 400
  doc.text('Precio final del cartel en ARS', card1X + 5, y + 21.5);

  // Card 2: SEÑA REQUERIDA (Calculada con el porcentaje configurado)
  const card2X = card1X + colW + 3;
  doc.setFillColor(236, 254, 255); // Cyan 50
  doc.roundedRect(card2X, y, colW, finCardH, 2, 2, 'F');
  doc.setDrawColor(cCyan[0], cCyan[1], cCyan[2]);
  doc.setLineWidth(0.6);
  doc.roundedRect(card2X, y, colW, finCardH, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(cCyanDark[0], cCyanDark[1], cCyanDark[2]);
  doc.text(`SEÑA PARA FABRICACIÓN (${depositPercentage}%)`, card2X + 5, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(formatARS(depositAmount), card2X + 5, y + 15);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(cCyanDark[0], cCyanDark[1], cCyanDark[2]);
  doc.text('Abonar para dar inicio a producción', card2X + 5, y + 21.5);

  // Card 3: SALDO PENDIENTE
  const card3X = card2X + colW + 3;
  doc.setFillColor(cBgCard[0], cBgCard[1], cBgCard[2]);
  doc.roundedRect(card3X, y, colW, finCardH, 2, 2, 'F');
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(card3X, y, colW, finCardH, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text(`SALDO RESTANTE (${100 - depositPercentage}%)`, card3X + 5, y + 6.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text(formatARS(balanceAmount), card3X + 5, y + 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text('A cancelar contra entrega o despacho', card3X + 5, y + 21.5);

  y += finCardH + 6;

  // ==========================================
  // 6. COMMERCIAL CONDITIONS, SEÑA & PAYMENT METHODS
  // ==========================================
  const termsBoxH = 50;
  doc.setFillColor(cBgLight[0], cBgLight[1], cBgLight[2]);
  doc.roundedRect(margin, y, contentWidth, termsBoxH, 2, 2, 'F');
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(margin, y, contentWidth, termsBoxH, 2, 2, 'S');

  let termY = y + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(cDarkNavy[0], cDarkNavy[1], cDarkNavy[2]);
  doc.text('CONDICIONES COMERCIALES, SEÑA Y FORMAS DE PAGO', margin + 5, termY);
  termY += 5.5;

  // Deposit detail paragraph
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  const depositText = `Para iniciar la fabricación se requiere una seña del ${depositPercentage}% (${formatARS(depositAmount)}). El saldo de ${formatARS(balanceAmount)} se abona contra entrega o previo al despacho del producto terminado.`;
  const splitDeposit = doc.splitTextToSize(depositText, contentWidth - 10);
  doc.text(splitDeposit, margin + 5, termY);
  termY += splitDeposit.length * 4 + 2;

  // Commercial conditions custom text if present
  if (quote.businessSnapshot.commercialConditions) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
    const condLines = doc.splitTextToSize(quote.businessSnapshot.commercialConditions, contentWidth - 10);
    const limitedLines = condLines.slice(0, 4);
    doc.text(limitedLines, margin + 5, termY);
    termY += limitedLines.length * 3.8 + 2;
  }

  // Active payment methods (only selected/enabled ones from profile)
  const rawMethods = (quote.businessSnapshot.paymentMethods || []) as Array<{
    name: string;
    details?: string;
    enabled?: boolean;
  }>;

  const hasStatusFlag = rawMethods.some((p) => typeof p.enabled === 'boolean');
  const selectedMethods = hasStatusFlag
    ? rawMethods.filter((p) => p.enabled === true)
    : rawMethods;

  const activePm =
    selectedMethods.length > 0
      ? selectedMethods.map((p) => p.name).join('   ·   ')
      : 'A convenir con el taller';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(cTextDark[0], cTextDark[1], cTextDark[2]);
  doc.text('Medios de pago aceptados:', margin + 5, termY + 2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(cCyanDark[0], cCyanDark[1], cCyanDark[2]);
  const splitPm = doc.splitTextToSize(activePm, contentWidth - 52);
  doc.text(splitPm.slice(0, 2), margin + 46, termY + 2);

  y += termsBoxH + 5;

  // ==========================================
  // 7. QUALITY & WARRANTY TRUST NOTE
  // ==========================================
  const warrantyBoxH = 26;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(cBorder[0], cBorder[1], cBorder[2]);
  doc.roundedRect(margin, y, contentWidth, warrantyBoxH, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cDarkNavy[0], cDarkNavy[1], cDarkNavy[2]);
  doc.text('COMPROMISO DE CALIDAD Y GARANTÍA', margin + 5, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text('• Iluminación LED Neón Flex de alta durabilidad (vida útil estimada de 50.000 horas).', margin + 5, y + 11.5);
  doc.text('• Incluye cableado transparente, ficha de conexión y fuente de alimentación homologada.', margin + 5, y + 16);
  doc.text('• Todos los carteles se entregan testeados, listos para colgar o amurar y conectar directamente a 220V.', margin + 5, y + 20.5);

  // ==========================================
  // 8. FOOTER
  // ==========================================
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(cTextMuted[0], cTextMuted[1], cTextMuted[2]);
  doc.text(
    `Documento comercial emitido por Cotizador Neón · ${quote.quoteNumber} · Gracias por confiar en nuestro taller`,
    pageWidth / 2,
    pageHeight - 7,
    { align: 'center' }
  );

  // Sanitize filename
  const safeClient = (quote.clientSnapshot.name || 'Cliente')
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]/g, '_')
    .substring(0, 25);
  const fileName = `Presupuesto-${quote.quoteNumber}-${safeClient}.pdf`;

  if (openInNewTab) {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  } else {
    doc.save(fileName);
  }
}
