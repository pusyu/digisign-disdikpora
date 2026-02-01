import * as PDFLib from 'pdf-lib';
import download from 'downloadjs';
import { readAsArrayBuffer } from './asyncReader';
import { noop } from './helper';

interface PDFObject {
    id: string;
    type: 'image';
    x: number;
    y: number;
    width: number;
    height: number;
    [key: string]: any;
}

interface ImageObject extends PDFObject {
    type: 'image';
    file: File | Blob;
    payload: HTMLImageElement;
}

export async function savePDF(
    pdfFile: File | Blob,
    allObjects: ImageObject[][],
    name: string,
    shouldDownload = true
): Promise<Blob | void> {
    let pdfDoc: PDFLib.PDFDocument;

    try {
        pdfDoc = await PDFLib.PDFDocument.load(await readAsArrayBuffer(pdfFile));
    } catch (e) {
        console.error('Failed to load PDF.', e);
        throw e;
    }

    const pages = pdfDoc.getPages();

    const pagesProcesses = pages.map(async (page, pageIndex) => {
        const pageObjects = allObjects[pageIndex] || [];

        // Use the CropBox (the visible area in PDF.js) for coordinate calculations
        const cropBox = page.getCropBox();
        const { width: cropW, height: cropH } = cropBox;
        const rotation = page.getRotation().angle;
        const isRotated = rotation === 90 || rotation === 270;

        // Visible dimensions in the editor
        const visibleHeight = isRotated ? cropW : cropH;

        const embedProcesses = pageObjects.map(async (object) => {
            if (object.type === 'image') {
                const imgObj = object as ImageObject;
                let { file, x, y, width, height } = imgObj;

                try {
                    let img: PDFLib.PDFImage;
                    const arrayBuffer = await readAsArrayBuffer(file);

                    if (file.type === 'image/jpeg') {
                        img = await pdfDoc.embedJpg(arrayBuffer);
                    } else {
                        img = await pdfDoc.embedPng(arrayBuffer);
                    }

                    return () => {
                        // PDF.js (0,0) is top-left of the CropBox.
                        // pdf-lib drawImage (0,0) is bottom-left of the MediaBox.

                        // To map Browser-Y (from top of CropBox) to PDF-Y (from bottom of MediaBox):
                        // PDF-Y = CropBox.y + (CropBox.height - Browser-Y - ImageHeight)

                        const drawX = cropBox.x + x;
                        const drawY = cropBox.y + (visibleHeight - y - height);

                        page.drawImage(img, {
                            x: drawX,
                            y: drawY,
                            width,
                            height,
                        });
                    };
                } catch (e) {
                    console.error('Failed to embed image.', e);
                    return noop;
                }
            }

            return noop;
        });

        const drawProcesses = await Promise.all(embedProcesses);
        drawProcesses.forEach((p) => p());
    });

    await Promise.all(pagesProcesses);

    try {
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        if (shouldDownload) {
            download(blob, name, 'application/pdf');
        }
        return blob;
    } catch (e) {
        console.error('Failed to save PDF.', e);
        throw e;
    }
}
