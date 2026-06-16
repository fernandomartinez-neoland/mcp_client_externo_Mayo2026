import { Client, StdioClientTransport } from '@modelcontextprotocol/client';
import fs from 'fs'; // <-- 1. Importamos el módulo de archivos nativo de Node

async function claseScrapingCreanova() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'] 
  });

  const client = new Client({ 
    name: 'ClienteClaseScraping', 
    version: '1.0.0' 
  });

  try {
    console.log("🌐 Levantando el navegador Chromium...");
    await client.connect(transport);
    
    console.log("🚀 Navegando a https://creanovatech.com/ ...");
    await client.callTool({
      name: "browser_navigate",
      arguments: { url: "https://creanovatech.com/" }
    });

    console.log("📄 Extrayendo el contenido de la web...");
    const resultadoScraping = await client.callTool({
      name: "browser_snapshot",
      arguments: {}
    });

    if (resultadoScraping.content && resultadoScraping.content[0]) {
       const textoExtraido = resultadoScraping.content[0].text;
       
       // --- 2. LA MAGIA: Guardamos el texto en un archivo fijo ---
       const nombreArchivoFijo = "mapa_actual.md";
       fs.writeFileSync(nombreArchivoFijo, textoExtraido, 'utf-8');
       
       console.log(`\n✅ ¡Éxito! El mapa de accesibilidad se ha guardado y sobrescrito en: ${nombreArchivoFijo}`);
       console.log("Ahora puedes pasarle este archivo directamente a tu IA.");
    }

  } catch (error) {
    console.error("❌ Error en el proceso de scraping:", error);
  } finally {
    console.log("🧹 Cerrando el navegador...");
    await client.close();
  }
}

claseScrapingCreanova();