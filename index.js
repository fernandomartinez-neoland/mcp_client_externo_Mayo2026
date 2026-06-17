import { Client, StdioClientTransport } from "@modelcontextprotocol/client";
import "dotenv/config";
import { Ollama } from "ollama";
import fs from "fs";


// ============================================================================
// 1. CONFIGURACIÓN DEL CEREBRO (OLLAMA)
// ============================================================================
const ai = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: "Bearer " + process.env.OLLAMA_API_KEY },
});

// Esta función es el "razonamiento" puro. Toma el mapa y decide la siguiente acción.
async function pensarSiguienteAccion(mapaWeb, objetivo) {
  const agente=fs.readFileSync('agente.md', 'utf8')
  console.log("ESTE ES EL AGENTE.MD: ", agente)
  const prompt = agente.replace('{{OBJETIVO}}', objetivo)
  .replace('{{MAPA_WEB}}', mapaWeb);

  process.stdout.write("🧠 Pensando... ");
  const response = await ai.chat({
    model: "gpt-oss:120b",
    messages: [{ role: "user", content: prompt }],
    stream: false,
  });

  const orden = response.message.content.trim();
  console.log(`¡Decidido! -> ${orden}`);
  return orden;
}

// ============================================================================
// 2. ORQUESTADOR DEL AGENTE AUTÓNOMO (EL BUCLE DE ACCIÓN)
// ============================================================================
async function iniciarAgenteAutonomo() {
  const transport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@playwright/mcp@latest"],
  });

  const client = new Client({ name: "AgenteIA_Autonomo", version: "1.0.0" });

  try {
    console.log("🌐 Iniciando el cuerpo del Agente (Navegador Chromium)...");
    await client.connect(transport);

    // 1. Posicionamos al agente en la línea de salida
    const urlInicial = "https://creanovatech.com/";
    console.log(`🚀 Navegando al punto de inicio: ${urlInicial}`);
    await client.callTool({
      name: "browser_navigate",
      arguments: { url: urlInicial },
    });

    // 2. Definimos la misión
    const objetivoDelUsuario =
      "Navega a la página de Contacto. Cuando encuentres el formulario, rellena el campo 'Tu nombre' con el valor 'Alumno Demo'. Luego finaliza.";
    console.log(`\n🎯 MISIÓN DEL AGENTE: "${objetivoDelUsuario}"`);

    // 3. INICIAMOS EL BUCLE AUTÓNOMO (Agentic Loop)
    let misionCompletada = false;
    let pasoActual = 1;
    const maxPasos = 10; // Límite de seguridad para la clase

    while (!misionCompletada && pasoActual <= maxPasos) {
      console.log(`\n--- PASO ${pasoActual} ---`);

      // A. Observar: El agente mira la pantalla
      const snapshot = await client.callTool({
        name: "browser_snapshot",
        arguments: {},
      });
      const mapaPantalla = snapshot.content[0].text;

      // (Opcional) Guardamos el mapa en disco para que el alumno lo vea
      fs.writeFileSync("mapa_agente.txt", mapaPantalla, "utf-8");

      // B. Razonar: El agente piensa qué hacer
      const ordenIA = await pensarSiguienteAccion(
        mapaPantalla,
        objetivoDelUsuario,
      );

      // C. Actuar: El código traduce la orden de la IA en comandos MCP
      // C. Actuar: El código traduce la orden de la IA en comandos MCP
      if (ordenIA === "DONE") {
        console.log("🎉 ¡El agente ha reportado que la misión fue un ÉXITO!");
        misionCompletada = true;
      } else if (ordenIA.startsWith("CLICK:")) {
        // La IA nos devuelve un texto dinámico, ej: "Contacto" o "Servicios"
        const textoObjetivo = ordenIA.split("CLICK:")[1].trim();
        console.log(`🖱️ Ejecutando clic en el texto: '${textoObjetivo}'`);

        const resultadoClic = await client.callTool({
          name: "browser_click",
          // Buscamos el texto dinámicamente en el DOM y cogemos el primero (nth=0)
          arguments: { target: `text="${textoObjetivo}" >> nth=0` },
        });

        if (resultadoClic.isError) {
          console.log(
            `⚠️ Error de Playwright al hacer clic:`,
            resultadoClic.content[0].text,
          );
        } else {
          console.log(`✅ Playwright dice: Clic realizado correctamente.`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
     } else if (ordenIA.startsWith("FILL:")) {
        const partes = ordenIA.split("FILL:")[1].split("|");
        const textoCampo = partes[0].trim();
        const textoAEscribir = partes[1].trim();

        console.log(`⌨️ Escribiendo '${textoAEscribir}' en la caja de texto: '${textoCampo}'`);

        const resultadoType = await client.callTool({
          name: "browser_type",
          // LA MAGIA: Le decimos a Playwright que busque por el 'role' exacto que aparece en el mapa
          arguments: {
            target: `role=textbox[name="${textoCampo}"]`,
            text: textoAEscribir,
          },
        });

        if (resultadoType.isError) {
          console.log(`⚠️ Error de Playwright al escribir:`, resultadoType.content[0].text);
        } else {
          console.log(`✅ Playwright dice: Texto escrito correctamente.`);
          // Pausa de 1.5s para que se vea claramente el texto escrito en pantalla/snapshot
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
      pasoActual++;
    }

    if (pasoActual > maxPasos) {
      console.log(
        "\n🛑 Se alcanzó el límite de pasos de seguridad. El agente se ha detenido.",
      );
    }
  } catch (error) {
    console.error("\n❌ Error crítico en el agente:", error);
  } finally {
    console.log("\n🧹 Apagando sistemas y cerrando navegador...");
    await client.close();
  }
}

iniciarAgenteAutonomo();
