import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import * as pdf from 'pdf-parse';

@Injectable()
export class Crawler {
  constructor() {}

  pdfUrl = 'https://diario.jt.jus.br/cadernos/Diario_J_08.pdf';
  outputFilePath = './pdfs/Diario_J_08.pdf';

  async download() {
    try {
      const response = await axios.get(this.pdfUrl, {
        responseType: 'arraybuffer',
      });
      fs.writeFileSync(this.outputFilePath, Buffer.from(response.data));
      console.log('PDF baixado com sucesso:', this.outputFilePath);
    } catch (error) {
      console.error('Erro ao baixar o PDF:', error);
    }
  }

  async getAllProcesses() {
    try {
      // Ler o conteúdo do PDF
      const dataBuffer = fs.readFileSync(this.outputFilePath);
      const pdfData = await pdf(dataBuffer);
      const pdfText = pdfData.text;

      const regex =
        /(?:Processo)(?:\s+)(?:Nº)(?:\s)(ROT|RORSum|ATOrd|ATSum|RPV|AR|CumPrSe|CumSen|CartPrecCiv|HTE)(?:\s|-)(\d{7}-\d{2}.\d{4}.\d{1,2}.\d{2}.\d{4})[\s\S]+?(?=(Processo)(\s+)(Nº)(\s)(ROT|RORSum|ATOrd|ATSum|RPV|AR|CumPrSe|CumSen|CartPrecCiv|HTE)(\s|-)\d{7}-\d{2}.\d{4}.\d{1,2}.\d{2}.\d{4}|$)/gis;

      const matches = [...pdfText.matchAll(regex)];

      const processos = matches.map((match) => {
        const tipo = match[1];
        const numero = match[2];
        const conteudo = match[0].trim().replace(/\n/g, ' ');
        return { tipo, numero, conteudo };
      });
      return this.toJsonProcesses(processos[123]);
    } catch (error) {
      console.error('Erro ao ler o arquivo PDF:', error);
    }
  }

  toJsonProcesses(process: { tipo: string; numero: string; conteudo: string }) {
    const regexAdvogado =
      /(ADVOGADO)\s*([^()]+)\s*\(OAB:\s*(\d+)\/([A-Z]+)\)/gis;
    const matches = [...process.conteudo.matchAll(regexAdvogado)];
    const advogados = matches.map((match) => {
      const advogado = match[2];
      const oab = match[3] + match[4];

      return { advogado, oab };
    });

    return { process, advogados };
  }
}
