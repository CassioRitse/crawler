import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import axios from 'axios';
import * as pdf from 'pdf-parse';
import { parseMonthToNum } from './enumMonth';

interface Publication {
  cnjNumber: string;
  number: string;
  keyword?: string;
  court: string;
  resume: string;
  content: string;
  divulgationDate: Date;
  publicationDate: Date;
}

interface Process {
  cnjNumber: string;
  content: string;
}

@Injectable()
export class Crawler {
  constructor() {}

  pdfUrl = 'https://diario.jt.jus.br/cadernos/Diario_J_08.pdf';
  outputFilePath = './pdfs/Diario_J_08.pdf';
  court = 'Tribunal Regional do Trabalho da 8a Região';
  pdfText: string;
  regexProcesso =
    /(?:Processo)(?:\s+)(?:Nº)(?:\s)(ROT|RORSum|ATOrd|ATSum|RPV|AR|CumPrSe|CumSen|CartPrecCiv|HTE)(?:\s|-)(\d{7}-\d{2}.\d{4}.\d{1,2}.\d{2}.\d{4})[\s\S]+?(?=(Processo)(\s+)(Nº)(\s)(ROT|RORSum|ATOrd|ATSum|RPV|AR|CumPrSe|CumSen|CartPrecCiv|HTE)(\s|-)\d{7}-\d{2}.\d{4}.\d{1,2}.\d{2}.\d{4}|$)/gis;
  keyword: string;
  divulgationDate: Date;
  publicationDate: Date;
  allPublications: Process[];
  publicationsWithKeyWord: Process[];

  async downloadPdf() {
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

  private setDivulgationDate() {
    const regexDivulgationDate =
      /(?=Data da disponibilização\:)([^\d]+), (\d{1,2}) de ([^\d]+) de (\d{4})/is;
    const matchDate = [...this.pdfText.match(regexDivulgationDate)];
    const monthIndex = parseMonthToNum(matchDate[3]);
    this.divulgationDate = new Date(
      Date.UTC(
        parseInt(matchDate[4], 10),
        monthIndex - 1,
        parseInt(matchDate[2], 10),
      ),
    );
  }

  async execute(keyword?: string) {
    try {
      // Ler o conteúdo do PDF
      const dataBuffer = fs.readFileSync(this.outputFilePath);
      const pdfData = await pdf(dataBuffer);
      this.pdfText = pdfData.text;

      this.setDivulgationDate();
      this.publicationDate = new Date(Date.now());

      this.setAllPublications();

      if (keyword) {
        this.keyword = keyword;
        this.setProcessWithKeyword();
        return this.returnAsPublication();
      }

      return this.allPublications;
    } catch (error) {
      console.error('Erro ao ler o arquivo PDF:', error);
    }
  }

  private setAllPublications() {
    const matchesProcesses = [...this.pdfText.matchAll(this.regexProcesso)];

    this.allPublications = matchesProcesses.map((match) => {
      const cnjNumber = match[1] + match[2];
      const content = match[0]
        .trim()
        .replace(/\n/g, ' ')
        .replace(
          /Tribunal Regional do Trabalho da 8ª Região\d+ Data da Disponibilização: ([A-Z][a-z]+-feira|Domingo|Sábado), \d+ de \w+ de \d+ Código para aferir autenticidade deste caderno: \d+/gi,
          ' ',
        );

      return { cnjNumber, content };
    });
  }

  private setProcessWithKeyword() {
    const regex = new RegExp(this.keyword, 'is');
    this.publicationsWithKeyWord = this.allPublications.filter((process) =>
      regex.test(process.content),
    );
  }

  private returnAsPublication() {
    const publications: Publication[] = this.publicationsWithKeyWord.map(
      (process) => {
        const resume = process.content.slice(0, 252);
        const number = process.cnjNumber.replace(/[^\d]/g, '');
        const divulgationDate = this.divulgationDate;
        const publicationDate = this.publicationDate;
        const court = this.court;

        return {
          cnjNumber: process.cnjNumber,
          number,
          keyword: this.keyword,
          court,
          resume,
          content: process.content,
          divulgationDate,
          publicationDate,
        };
      },
    );
    return publications;
  }
}
