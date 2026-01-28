import jsPDF from 'jspdf';

export interface PDFExportOptions {
  proposal: string;
  clientName: string;
  tenant: any;
  services: any[];
  selectedServices: any[];
}

export const renderTurkishText = (
  text: string,
  fontSize: number,
  fontWeight: string,
  color: string,
  forceWidthMm?: number,
) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const scale = 4;
  const fontSizeInPx = fontSize * scale;
  ctx.font = `${fontWeight} ${fontSizeInPx}px Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

  const metrics = ctx.measureText(text);
  canvas.width = metrics.width;
  canvas.height = fontSizeInPx * 1.4;

  ctx.font = `${fontWeight} ${fontSizeInPx}px Inter, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, canvas.height / 2);

  let finalWidthMm = (metrics.width / fontSizeInPx) * fontSize * 0.3527;
  let finalHeightMm = (canvas.height / fontSizeInPx) * fontSize * 0.3527;

  if (forceWidthMm) {
    const ratio = forceWidthMm / finalWidthMm;
    finalWidthMm = forceWidthMm;
    finalHeightMm = finalHeightMm * ratio;
  }

  return {
    data: canvas.toDataURL('image/png'),
    width: finalWidthMm,
    height: finalHeightMm,
  };
};

export const exportToPDF = async (options: PDFExportOptions) => {
  const { proposal, clientName, tenant, services, selectedServices } = options;

  const doc = new jsPDF();
  const margin = 20;
  const marginLeft = margin;
  const marginRight = margin / 2;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - marginLeft - marginRight;

  const toTitleCaseTr = (str: string) => {
    if (!str) return '';
    return str
      .split(' ')
      .map((word) => {
        if (!word) return '';
        return (
          word.charAt(0).toLocaleUpperCase('tr-TR') +
          word.slice(1).toLocaleLowerCase('tr-TR')
        );
      })
      .join(' ');
  };

  const trFix = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*/g, '');
  };

  const getBase64Image = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('Canvas context not available');
        }
      };
      img.onerror = () => reject('Image load error');
      img.src = url;
    });
  };

  const getGrayscaleBase64Image = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.filter = 'grayscale(100%)';
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } else {
          reject('Canvas context not available');
        }
      };
      img.onerror = () => reject('Image load error');
      img.src = url;
    });
  };

  const parseMarkdownBudgetTable = (content: string) => {
    const lines = content.split('\n').map((line) => line.trim());
    const headerIndex = lines.findIndex(
      (line) => line.startsWith('|') && line.toLowerCase().includes('hizmet'),
    );
    if (headerIndex === -1) return [];

    const tableLines: string[] = [];
    for (let i = headerIndex; i < lines.length; i++) {
      const line = lines[i];
      if (!line.startsWith('|')) break;
      tableLines.push(line);
    }

    if (tableLines.length < 3) return [];

    const dataLines = tableLines.slice(2);
    const normalizeNumber = (value: string) => {
      const cleaned = value
        .replace(/\./g, '')
        .replace(',', '.')
        .replace(/[^\d.]/g, '');
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };

    const result: any[] = [];

    for (const line of dataLines) {
      const parts = line.split('|').map((part) => part.trim());
      const cells = parts.filter((part) => part.length > 0);
      if (cells.length < 5) continue;

      const name = cells[0];
      if (!name || name.toLowerCase().startsWith('toplam')) continue;

      const unitPriceRaw = cells[1];
      const quantityRaw = cells[2];
      const periodRaw = cells[3];

      const quantity = parseInt(quantityRaw.replace(/[^\d]/g, ''), 10) || 1;
      const price = normalizeNumber(unitPriceRaw);

      const periodLower = periodRaw.toLowerCase();
      let billingCycle = 'ONCE';
      if (periodLower.includes('ay')) billingCycle = 'MONTHLY';
      else if (periodLower.includes('yıl') || periodLower.includes('yll') || periodLower.includes('sen')) billingCycle = 'YEARLY';

      result.push({
        serviceId: undefined,
        name,
        price,
        quantity,
        billingCycle
      });
    }

    return result;
  };

  let effectiveSelectedServices: any[] = Array.isArray(selectedServices) ? [...selectedServices] : [];
  if (!effectiveSelectedServices.length) {
    const parsedFromMarkdown = parseMarkdownBudgetTable(proposal);
    if (parsedFromMarkdown.length) {
      effectiveSelectedServices = parsedFromMarkdown;
    }
  }

  let sections = proposal.split('[PAGE_BREAK]').map(p => p.trim()).filter(p => p);

  const getSectionTitle = (content: string) => {
    const match = content.match(/^#+\s+(.*)/m);
    return match ? match[1].trim() : '';
  };

  const investmentIndex = sections.findIndex(section => {
    const title = getSectionTitle(section).toLowerCase();
    return title.includes('yatırım') || title.includes('bütçe');
  });

  const processIndex = sections.findIndex(section => {
    const title = getSectionTitle(section).toLowerCase();
    return title.includes('proje süreci') || title.includes('ekip');
  });

  if (investmentIndex !== -1 && processIndex !== -1 && processIndex > investmentIndex) {
    sections[investmentIndex] = `${sections[investmentIndex].trim()}\n\n${sections[processIndex].trim()}`;
    sections.splice(processIndex, 1);
  }

  const hasStructuredBudgetGlobal = Array.isArray(effectiveSelectedServices) && effectiveSelectedServices.length > 0;
  let budgetRendered = false;
  let currentPage = 1;

  const footerHeight = 15;
  const renderFooter = (pNum: number) => {
    const footerY = pageHeight - footerHeight;
    doc.setFillColor(15, 15, 15);
    doc.rect(0, footerY, pageWidth, footerHeight, 'F');
    
    const footerTextY = footerY + (footerHeight / 2);
    
    const agencyName = tenant?.name || "One Click Works";
    const agencyInfoImg = renderTurkishText(agencyName, 7, '600', '#ffffff');
    const mailImg = renderTurkishText("info@oneclickworks.com", 7, 'normal', '#ffffff');

    if (agencyInfoImg) doc.addImage(agencyInfoImg.data, 'PNG', margin, footerTextY - (agencyInfoImg.height / 2), agencyInfoImg.width, agencyInfoImg.height);
    if (mailImg) doc.addImage(mailImg.data, 'PNG', pageWidth - marginRight - mailImg.width, footerTextY - (mailImg.height / 2), mailImg.width, mailImg.height);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text(`${pNum}`, pageWidth / 2, footerTextY, { align: 'center', baseline: 'middle' });
  };

  for (let index = 0; index < sections.length; index++) {
    const sectionContent = sections[index];
    if (index > 0) {
      doc.addPage();
      currentPage++;
    }
    
    const isCover = index === 0;
    
    if (isCover) {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      const dateStr = new Date().toLocaleDateString('tr-TR');
      const dateImg = renderTurkishText(dateStr, 8, 'normal', '#787878');
      if (dateImg) {
        doc.addImage(dateImg.data, 'PNG', pageWidth - marginRight - dateImg.width, 15 - (dateImg.height / 2), dateImg.width, dateImg.height);
      }

      try {
        const logoToUse = tenant?.logoUrl || '/images/logo-ocw.png';
        const logoBase64 = await getBase64Image(logoToUse);
        const logoWidth = 50; 
        const logoHeight = 20;
        const logoX = pageWidth - marginRight - logoWidth;
        const logoY = 28;
        
        doc.addImage(logoBase64, 'PNG', logoX, logoY, logoWidth, logoHeight);

        let currentY = logoY + logoHeight + 2; 

        if (!tenant?.logoUrl) {
          const creativeImg = renderTurkishText("CREATIVE", 22, '600', '#666666', logoWidth);
          const agencyImg = renderTurkishText("AGENCY", 22, '600', '#666666', logoWidth);
          const strategyImg = renderTurkishText("FİKİR TASARIM STRATEJİ", 8.5, '500', '#e31e24', logoWidth);

          if (creativeImg) {
            doc.addImage(creativeImg.data, 'PNG', logoX, currentY, creativeImg.width, creativeImg.height);
            currentY += creativeImg.height;
          }
          if (agencyImg) {
            doc.addImage(agencyImg.data, 'PNG', logoX, currentY, agencyImg.width, agencyImg.height);
            currentY += agencyImg.height + 1.5;
          }
          if (strategyImg) {
            doc.addImage(strategyImg.data, 'PNG', logoX, currentY, strategyImg.width, strategyImg.height);
          }
        } else {
          const agencyNameImg = renderTurkishText(tenant.name.toUpperCase(), 12, '600', '#666666', logoWidth);
          if (agencyNameImg) {
            doc.addImage(agencyNameImg.data, 'PNG', logoX, currentY, agencyNameImg.width, agencyNameImg.height);
          }
        }
      } catch (e) {
        const agencyName = tenant?.name || "ocw";
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(agencyName, pageWidth - marginRight, 35, { align: 'right' });
      }

      let brandY = 81;
      const brandNameText = toTitleCaseTr(clientName);
      const brandImg = renderTurkishText(brandNameText, 22, 'bold', '#000000');
      const subtitleImg = renderTurkishText("Teklif Dosyası", 13, 'normal', '#3c3c3c');

      if (brandImg) {
        doc.addImage(brandImg.data, 'PNG', margin, brandY, brandImg.width, brandImg.height);
        brandY += brandImg.height + 2;
      }
      if (subtitleImg) {
        doc.addImage(subtitleImg.data, 'PNG', margin, brandY, subtitleImg.width, subtitleImg.height);
        brandY += subtitleImg.height + 8;
      }

      let serviceY = brandY;
      const selectedServicesData = effectiveSelectedServices.map(ss => {
        const service = services.find(s => s.id === ss.serviceId);
        return service?.name || ss.name || '';
      }).filter(Boolean);

      selectedServicesData.forEach((serviceName, idx) => {
        const formattedServiceName = toTitleCaseTr(serviceName);
        const serviceImg = renderTurkishText(`${idx + 1}. ${formattedServiceName}`, 10, 'normal', '#000000');
        if (serviceImg) {
          doc.addImage(serviceImg.data, 'PNG', margin, serviceY, serviceImg.width, serviceImg.height);
          serviceY += 8;
        }
      });

      const imgY = 160;
      const imgHeight = pageHeight - imgY - footerHeight;

      try {
        const heroImgUrl = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
        const heroBase64 = await getGrayscaleBase64Image(heroImgUrl);
        doc.addImage(heroBase64, 'JPEG', 0, imgY, pageWidth, imgHeight);
        
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(255, 255, 255); 
        doc.setLineWidth(0.5); 
        doc.triangle(0, imgY - 1, pageWidth, imgY - 1, 0, imgY + 25, 'FD');
      } catch (e) {
        doc.setFillColor(240, 240, 240);
        doc.rect(0, imgY, pageWidth, imgHeight, 'F');
      }

      doc.setFillColor(20, 20, 20); 
      doc.rect(margin, pageHeight - 85, 8, 45, 'F');
      doc.setFillColor(60, 60, 60); 
      doc.rect(margin, pageHeight - 65, 8, 25, 'F');
      doc.setFillColor(120, 120, 120); 
      doc.rect(margin, pageHeight - 50, 8, 10, 'F');

      try {
        const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://oneclickworks.com';
        const qrBase64 = await getBase64Image(qrUrl);
        
        const qrSize = 18;
        const padding = 3;
        const boxSize = qrSize + (padding * 2);
        const qrX = pageWidth - marginRight - qrSize - padding;
        const qrY = pageHeight - 45;

        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.1);
        doc.rect(qrX - padding, qrY - padding, boxSize, boxSize + 4, 'FD');
        
        doc.addImage(qrBase64, 'PNG', qrX, qrY, qrSize, qrSize);
        
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(5);
        doc.text("oneclickworks.com", qrX + (qrSize/2), qrY + qrSize + 3, { align: 'center' });
      } catch (e) {
        // Skip if fails
      }

      renderFooter(currentPage);

    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.setFillColor(40, 40, 40);
      doc.rect(margin, 15, 35, 1.5, 'F');

      let yPos = 46;
      
      const titleMatch = sectionContent.match(/^#+\s+(.*)/m);
      const title = titleMatch ? titleMatch[1] : `Bölüm ${index}`;
      const cleanTitle = toTitleCaseTr(title);
      
      const titleImg = renderTurkishText(cleanTitle, 16, '800', '#000000');
      if (titleImg) {
        doc.addImage(titleImg.data, 'PNG', margin, 30, titleImg.width, titleImg.height);
      }
      
      doc.setFontSize(10.5);
      doc.setTextColor(30, 30, 30);
      doc.setLineHeightFactor(1.6);
      
      const cleanContent = sectionContent.replace(/^#+\s+.*\n?/m, '').trim();
      const paragraphs = cleanContent.split('\n');
      
      paragraphs.forEach((para: string) => {
        const trimmedPara = para.trim();
        if (!trimmedPara) {
          yPos += 2;
          return;
        }

        const isHeadingLine = /^#+\s+/.test(trimmedPara);
        if (isHeadingLine) {
          const headingText = trFix(trimmedPara.replace(/^#+\s+/, '').trim());
          const headingImg = renderTurkishText(headingText, 13, '800', '#000000');
          
          if (yPos > pageHeight - 25) {
            renderFooter(currentPage);
            doc.addPage();
            currentPage++;
            yPos = 30;
          }

          if (headingImg) {
            doc.addImage(headingImg.data, 'PNG', margin, yPos, headingImg.width, headingImg.height);
            yPos += headingImg.height + 6;
          } else {
            yPos += 6;
          }

          return;
        }

        const lowerPara = trimmedPara.toLowerCase();
        if (lowerPara.includes('toplam yatırım')) {
          return;
        }

        const isTableLine = trimmedPara.startsWith('|') || 
                          trimmedPara.startsWith('+-') || 
                          trimmedPara.startsWith('|-') || 
                          (trimmedPara.startsWith('---') && (trimmedPara.includes('|') || index > 0));
        
        if (hasStructuredBudgetGlobal && isTableLine) {
          return;
        }

        const isListItem = trimmedPara.startsWith('*') || trimmedPara.startsWith('-') || /^\d+\./.test(trimmedPara);
        let textToRender = trFix(trimmedPara);
        
        if (isListItem) {
          textToRender = textToRender.replace(/^([\*\-]|(\d+\.))\s*/, '').trim();
        }

        const isSubHeading = textToRender.endsWith(':') || 
                             textToRender.endsWith('?') || 
                             (isListItem && textToRender.includes(':') && textToRender.length < 120);
        
        if (isSubHeading) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
        }

        const allowedWidth = isListItem ? maxWidth - 18 : maxWidth - 12;
        const lines = doc.splitTextToSize(textToRender, allowedWidth);
        
        lines.forEach((line: string, lineIdx: number) => {
          if (yPos > pageHeight - 25) {
            renderFooter(currentPage);
            doc.addPage();
            currentPage++;
            yPos = 30;
          }

          const xPos = isListItem ? margin + 7 : margin;
          
          if (isListItem && lineIdx === 0) {
            const bulletText = trimmedPara.match(/^(\d+\.)/) ? trimmedPara.match(/^(\d+\.)/)![1] : "•";
            const bulletImg = renderTurkishText(bulletText, 10.5, 'normal', '#282828');
            if (bulletImg) {
              doc.addImage(bulletImg.data, 'PNG', margin, yPos - 3.5, bulletImg.width, bulletImg.height);
            }
          }

          const lineImg = renderTurkishText(
            line, 
            10.5, 
            isSubHeading ? '800' : 'normal', 
            isSubHeading ? '#000000' : '#282828'
          );

          if (lineImg) {
            const finalWidth = Math.min(lineImg.width, allowedWidth);
            const ratio = finalWidth / lineImg.width;
            const finalHeight = lineImg.height * ratio;

            doc.addImage(lineImg.data, 'PNG', xPos, yPos - 3.5, finalWidth, finalHeight);
          }
          
          yPos += 6.5;
        });

        yPos += 0.5;
      });

      if (!budgetRendered && hasStructuredBudgetGlobal) {
        const titleLower = cleanTitle.toLowerCase();
        const attachHere = titleLower.includes('yatırım') || titleLower.includes('bütçe');
        const isLastSection = index === sections.length - 1;

        if (attachHere || isLastSection) {
          const selectedServicesData = effectiveSelectedServices.map(ss => {
            const service = services.find(s => s.id === ss.serviceId);
            return {
              name: ss.name || service?.name || 'Hizmet',
              basePrice: ss.price || service?.basePrice || 0,
              billingCycle: ss.billingCycle || service?.billingCycle || 'MONTHLY',
              quantity: ss.quantity || 1
            };
          });
          
          if (selectedServicesData.length > 0) {
            budgetRendered = true;

            yPos += 12;
            const budgetTitleImg = renderTurkishText("Proje Bütçesi:", 12, '800', '#000000');
            if (budgetTitleImg) {
              doc.addImage(budgetTitleImg.data, 'PNG', margin, yPos, budgetTitleImg.width, budgetTitleImg.height);
              yPos += budgetTitleImg.height + 8;
            }
            if (yPos > pageHeight - 60) {
              renderFooter(currentPage);
              doc.addPage();
              currentPage++;
              yPos = 30;
            }

            const colHizmet = 65;
            const colAdet = 15;
            const colBirim = 30;
            const colKdv = 25;
            const colToplam = 35;
            
            const xHizmet = margin;
            const xAdet = xHizmet + colHizmet;
            const xBirim = xAdet + colAdet;
            const xKdv = xBirim + colBirim;
            const xToplam = xKdv + colKdv;

            // Tablo Başlığı
            doc.setFillColor(240, 240, 240); // Light Gray
            doc.rect(margin, yPos, maxWidth, 10, 'F');
            doc.setDrawColor(0, 0, 0); // Black border
            doc.setLineWidth(0.1);
            // doc.rect(margin, yPos, maxWidth, 10, 'S');

            const headHizmet = renderTurkishText("Hizmet", 9, 'bold', '#000000');
            const headAdet = renderTurkishText("Adet", 9, 'bold', '#000000');
            const headBirim = renderTurkishText("Birim Fiyat", 9, 'bold', '#000000');
            const headKdv = renderTurkishText("KDV (%20)", 9, 'bold', '#000000');
            const headToplam = renderTurkishText("Toplam", 9, 'bold', '#000000');

            if (headHizmet) doc.addImage(headHizmet.data, 'PNG', xHizmet + 2, yPos + 3, headHizmet.width, headHizmet.height);
            if (headAdet) doc.addImage(headAdet.data, 'PNG', xAdet + 2, yPos + 3, headAdet.width, headAdet.height);
            if (headBirim) doc.addImage(headBirim.data, 'PNG', xBirim + 2, yPos + 3, headBirim.width, headBirim.height);
            if (headKdv) doc.addImage(headKdv.data, 'PNG', xKdv + 2, yPos + 3, headKdv.width, headKdv.height);
            if (headToplam) doc.addImage(headToplam.data, 'PNG', xToplam + 2, yPos + 3, headToplam.width, headToplam.height);

            yPos += 12;
            let grandTotal = 0;
            let subTotalSum = 0;
            let kdvTotalSum = 0;

            // Satırlar
            selectedServicesData.forEach((service, idx) => {
              if (yPos > pageHeight - 45) { // Daha fazla yer bırak (footer + toplam alanı için)
                renderFooter(currentPage);
                doc.addPage();
                currentPage++;
                yPos = 30;
                
                // Yeni sayfada başlığı tekrar çiz
                doc.setFillColor(240, 240, 240);
                doc.rect(margin, yPos, maxWidth, 10, 'F');
                if (headHizmet) doc.addImage(headHizmet.data, 'PNG', xHizmet + 2, yPos + 3, headHizmet.width, headHizmet.height);
                if (headAdet) doc.addImage(headAdet.data, 'PNG', xAdet + 2, yPos + 3, headAdet.width, headAdet.height);
                if (headBirim) doc.addImage(headBirim.data, 'PNG', xBirim + 2, yPos + 3, headBirim.width, headBirim.height);
                if (headKdv) doc.addImage(headKdv.data, 'PNG', xKdv + 2, yPos + 3, headKdv.width, headKdv.height);
                if (headToplam) doc.addImage(headToplam.data, 'PNG', xToplam + 2, yPos + 3, headToplam.width, headToplam.height);
                yPos += 12;
              }

              const cycleMap: any = { 'MONTHLY': 'Ay', 'YEARLY': 'Yıl', 'ONCE': 'Adet' };
              const formattedName = toTitleCaseTr(service.name || '');
              const quantity = service.quantity || 1;
              const unitPrice = service.basePrice || 0;
              const subTotal = quantity * unitPrice;
              const kdvAmount = subTotal * 0.20;
              const totalWithKdv = subTotal + kdvAmount;
              
              grandTotal += totalWithKdv;
              subTotalSum += subTotal;
              kdvTotalSum += kdvAmount;

              // Zebra Striping - Very subtle
              if (idx % 2 === 0) {
                doc.setFillColor(250, 250, 250); // Very light gray
                doc.rect(margin, yPos, maxWidth, 10, 'F');
              } else {
                doc.setFillColor(255, 255, 255); // white
                doc.rect(margin, yPos, maxWidth, 10, 'F');
              }

              doc.setDrawColor(230, 230, 230); // light border
              doc.line(margin, yPos + 10, margin + maxWidth, yPos + 10);

              const sNameImg = renderTurkishText(formattedName, 9, 'normal', '#000000');
              const sAdetImg = renderTurkishText(`${quantity} ${cycleMap[service.billingCycle] || 'Adet'}`, 9, 'normal', '#000000');
              const sBirimImg = renderTurkishText(`${unitPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 9, 'normal', '#000000');
              const sKdvImg = renderTurkishText(`${kdvAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 9, 'normal', '#000000');
              const sTotalImg = renderTurkishText(`${totalWithKdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 9, 'bold', '#000000');

              if (sNameImg) doc.addImage(sNameImg.data, 'PNG', xHizmet + 2, yPos + 2.5, sNameImg.width, sNameImg.height);
              if (sAdetImg) doc.addImage(sAdetImg.data, 'PNG', xAdet + 2, yPos + 2.5, sAdetImg.width, sAdetImg.height);
              if (sBirimImg) doc.addImage(sBirimImg.data, 'PNG', xBirim + 2, yPos + 2.5, sBirimImg.width, sBirimImg.height);
              if (sKdvImg) doc.addImage(sKdvImg.data, 'PNG', xKdv + 2, yPos + 2.5, sKdvImg.width, sKdvImg.height);
              if (sTotalImg) doc.addImage(sTotalImg.data, 'PNG', xToplam + 2, yPos + 2.5, sTotalImg.width, sTotalImg.height);

              yPos += 10;
            });

            // Modern Toplam Alanı
            yPos += 5;
            
            // Toplam kutusunun genişliği
            const summaryBoxWidth = 80;
            const summaryBoxX = margin + maxWidth - summaryBoxWidth;
            
            // Ara Toplam
            const lblSub = renderTurkishText("Ara Toplam:", 9, 'normal', '#000000');
            const valSub = renderTurkishText(`${subTotalSum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 9, 'normal', '#000000');
            
            if (lblSub) doc.addImage(lblSub.data, 'PNG', summaryBoxX, yPos, lblSub.width, lblSub.height);
            if (valSub) doc.addImage(valSub.data, 'PNG', margin + maxWidth - valSub.width - 2, yPos, valSub.width, valSub.height);
            
            yPos += 6;

            // KDV
            const lblKdv = renderTurkishText("KDV (%20):", 9, 'normal', '#000000');
            const valKdv = renderTurkishText(`${kdvTotalSum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 9, 'normal', '#000000');
            
            if (lblKdv) doc.addImage(lblKdv.data, 'PNG', summaryBoxX, yPos, lblKdv.width, lblKdv.height);
            if (valKdv) doc.addImage(valKdv.data, 'PNG', margin + maxWidth - valKdv.width - 2, yPos, valKdv.width, valKdv.height);

            yPos += 8;

            // Genel Toplam Barı
            doc.setFillColor(240, 240, 240); // Light Gray background for total
            doc.rect(summaryBoxX - 5, yPos - 2, summaryBoxWidth + 5, 12, 'F'); // Background
            
            const lblTotal = renderTurkishText("GENEL TOPLAM:", 9, 'bold', '#000000');
            const valTotal = renderTurkishText(`${grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 9, 'bold', '#000000');

            if (lblTotal) doc.addImage(lblTotal.data, 'PNG', summaryBoxX, yPos + 2.5, lblTotal.width, lblTotal.height);
            if (valTotal) doc.addImage(valTotal.data, 'PNG', margin + maxWidth - valTotal.width - 2, yPos + 2.5, valTotal.width, valTotal.height);
          }
        }
      }

      renderFooter(currentPage);
    }
  }

  doc.save(`teklif-${clientName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
};
