import { Client, StdioClientTransport } from '@modelcontextprotocol/client';
import "dotenv/config";
import { Ollama } from "ollama";
import fs from "fs";

// 1. INICIALIZAMOS TU "CEREBRO" (OLLAMA)
const ai = new Ollama({
  host: "https://ollama.com", // Tu endpoint
  headers: { Authorization: "Bearer " + process.env.OLLAMA_API_KEY },
});

// Función adaptada de tu código para preguntarle a la IA usando un Stream
async function preguntarA_LaIA(mapaWeb, instruccionUsuario) {
  const prompt = `
    Eres un agente de automatización web.
    Aquí tienes el mapa de accesibilidad de una página web actual:
    ---
    ${mapaWeb}
    ---
    El usuario quiere: "${instruccionUsuario}".
    Basado en el mapa, dame el texto que habla sobre lo que solicita el usuario
    Devuelve ÚNICAMENTE el texto exacto del elemento, sin explicaciones ni saludos.
  `;

  console.log("\n🧠 Pensando la respuesta con Ollama...");
  const responseStream = await ai.chat({
    model: "gpt-oss:120b",
    messages: [{ role: "user", content: prompt }],
    stream: true,
  });

  let aiResponseText = "";
  for await (const part of responseStream) {
    if (part.message?.content) {
      aiResponseText += part.message.content;
      process.stdout.write(part.message.content); // Imprimimos en tiempo real
    }
  }
  return aiResponseText.trim();
}

// 2. INICIALIZAMOS TU "CUERPO" (MCP PLAYWRIGHT)
async function orquestarAgenteScraping() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'] 
  });

  const client = new Client({ name: 'AgenteIA_Clase', version: '1.0.0' });

  try {
    console.log("🌐 Conectando el cuerpo robótico (Playwright)...");
    await client.connect(transport);

    // PASO A: El cuerpo interactúa con el mundo físico (Navega)
    console.log("🚀 Navegando a https://creanovatech.com/ ...");
    await client.callTool({
      name: "browser_navigate",
      arguments: { url: "https://creanovatech.com/" }
    });

    // PASO B: El cuerpo usa sus "ojos" (Snapshot)
    console.log("📸 Tomando foto estructural de la web...");
    const resultadoScraping = await client.callTool({
      name: "browser_snapshot",
      arguments: {}
    });

    const textoExtraido = resultadoScraping.content[0].text;
    
    // Guardamos la evidencia como aprendimos antes
    fs.writeFileSync("mapa_actual.md", textoExtraido, 'utf-8');

    // PASO C: El cerebro entra en acción (Llamamos a tu IA de Ollama)
    // Le pasamos la visión de la web y una instrucción directa
    console.log("\n🤖 Pasando el control a la Inteligencia Artificial...");
    const decisionIA = await preguntarA_LaIA(
      textoExtraido, 
      "Quiero ver los perfiles del equipo o conocer más sobre ellos." // Instrucción simulada del usuario
    );

    console.log(`\n\n✅ La IA decidió que el objetivo es: [${decisionIA}]`);

    // PASO D (Opcional): El cuerpo ejecuta la decisión del cerebro
    /*
    console.log(`Haciendo clic automático en: ${decisionIA}...`);
    await client.callTool({
      name: "browser_click",
      arguments: { selector: `text="${decisionIA}"` }
    });
    */

  } catch (error) {
    console.error("\n❌ Error en el agente:", error);
  } finally {
    console.log("\n🧹 Apagando sistemas...");
    await client.close();
  }
}

orquestarAgenteScraping();