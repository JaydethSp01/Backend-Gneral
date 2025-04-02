const puppeteer = require("puppeteer");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Usamos un timeout de 20 horas (72000000 ms) para evaluaciones; ajústalo según necesites
const LONG_TIMEOUT = 72000000;

/*
  Al lanzar el navegador, recomendamos incluir:
  
  const browser = await puppeteer.launch({
    headless: true,
    protocolTimeout: LONG_TIMEOUT, // Aumenta el tiempo de espera del protocolo
    // otros parámetros...
  });
*/

/** Función para preparar la página con configuraciones comunes */
async function preparePage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 670, height: 599 });
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
  );
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (["image", "stylesheet", "font"].includes(req.resourceType())) {
      req.abort();
    } else {
      req.continue();
    }
  });
  page.setDefaultTimeout(7880000);
  return page;
}

/** Función auxiliar para reintentar evaluaciones en la página */
async function safeEvaluate(page, func, ...args) {
  const maxAttempts = 2;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      return await Promise.race([
        page.evaluate(func, ...args),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Evaluation timed out")),
            LONG_TIMEOUT
          )
        ),
      ]);
    } catch (error) {
      attempts++;
      console.warn(
        `safeEvaluate: ${error.message}. Reintentando ${attempts}/${maxAttempts}...`
      );
      await delay(500);
    }
  }
  console.error("safeEvaluate: falló después de 2 intentos.");
  return null;
}

/** Función para extraer datos de los acordeones */
async function extractAccordionData(page) {
  return await safeEvaluate(page, () => {
    const accordionContainers = Array.from(
      document.querySelectorAll("div.Box.Flex.ggRYVx.iWGVcA")
    );
    const results = [];
    accordionContainers.forEach((container) => {
      const content = container.querySelector("[role='region']");
      if (content) {
        const rows = Array.from(
          content.querySelectorAll("div.Box.Flex.dlyXLO.bnpRyo")
        );
        const stats = {};
        rows.forEach((row) => {
          const spans = row.querySelectorAll("span.Text.ietnEf");
          if (spans.length === 2) {
            const label = spans[0].textContent.trim();
            const value = spans[1].textContent.trim();
            stats[label] = value;
          }
        });
        results.push(stats);
      }
    });
    return results;
  });
}

/** Método principal de extracción (primero) */
async function extractStatCross(label, page) {
  let attempts = 2;
  let value = null;
  while (attempts > 0) {
    console.debug(
      `Buscando estadística para '${label}', intentos restantes: ${attempts}`
    );
    try {
      value = await safeEvaluate(
        page,
        (label) => {
          const statDivs = Array.from(
            document.querySelectorAll(
              "div.Box.Flex.dlyXLO.bnpRyo, div.Box.Flex.ckZoZd.eCIOYr, div.Box.Flex.ggRYVx.iWGVcA"
            )
          );
          for (let div of statDivs) {
            const spans = div.querySelectorAll("span.Text.ietnEf");
            if (spans.length === 2 && spans[0].textContent.trim() === label) {
              return spans[1]?.textContent.trim() || "0";
            }
          }
          return null;
        },
        label
      );
      if (value !== null) return value;
    } catch (error) {
      console.warn(`Error al extraer la estadística '${label}': ${error}`);
    }
    console.log(
      `⏳ Reintentando obtener '${label}' (${
        attempts - 1
      } intentos restantes)...`
    );
    await delay(500);
    attempts--;
  }
  console.log(`Fallback de extractStatCross para '${label}'`);
  return "0";
}

/** Método alternativo de extracción (fallback) */
async function extractStat(label, page) {
  return await safeEvaluate(
    page,
    (label) => {
      const statContainer = Array.from(
        document.querySelectorAll(".sc-hLBbgP")
      ).find((el) =>
        el.textContent.trim().toLowerCase().includes(label.toLowerCase())
      );
      if (statContainer) {
        const statValue = statContainer.nextElementSibling
          ? statContainer.nextElementSibling.textContent.trim()
          : "0";
        const match = statValue.match(/(\d+)\s*$/);
        return match ? match[1] : statValue;
      }
      console.log(
        `No se encontró '${label}' en los contenedores habituales. Ejecutando fallback alterno...`
      );
      const elements = Array.from(
        document.querySelectorAll("span, div")
      ).filter((el) =>
        el.textContent.trim().toLowerCase().includes(label.toLowerCase())
      );
      if (elements.length > 0) {
        const element = elements[0];
        let adjacentText = "";
        if (element.nextElementSibling) {
          adjacentText = element.nextElementSibling.textContent.trim();
        } else if (
          element.parentElement &&
          element.parentElement.nextElementSibling
        ) {
          adjacentText =
            element.parentElement.nextElementSibling.textContent.trim();
        }
        const match = adjacentText.match(/(\d+)\s*$/);
        return match ? match[1] : adjacentText;
      }
      return "0";
    },
    label
  );
}

/** Función que realiza un "mapeo doble" para cada estadística */
async function getDoubleMappedStat(label, page) {
  let value = await extractStatCross(label, page);
  if (!value || value === "0" || value.trim() === "") {
    console.log(`Valor para '${label}' es 0 o vacío, usando método alterno...`);
    value = await extractStat(label, page);
  }
  return value;
}

/** Scraping de equipos desde la página de la liga */
const scrapeTeamsFromSofascore = async (leagueUrl, browser) => {
  console.log(`🔍 Extrayendo equipos de ${leagueUrl}...`);
  const page = await preparePage(browser);
  try {
    await page.goto(leagueUrl, { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".Text.fsoviT, .Text.jSRBkq");

    const teams = await page.evaluate(() => {
      const nodes = Array.from(
        document.querySelectorAll(".Text.fsoviT, .Text.jSRBkq")
      );
      const teamMap = {};
      nodes.forEach((el) => {
        const name = el.innerText.trim();
        const linkElement = el.closest("a");
        const link = linkElement
          ? "https://www.sofascore.com" + linkElement.getAttribute("href")
          : null;
        if (link && !teamMap[name]) {
          teamMap[name] = { name, link };
        }
      });
      return Object.values(teamMap);
    });

    console.log(`✅ ${teams.length} equipos extraídos.`);
    return teams;
  } catch (error) {
    console.error("❌ Error al extraer equipos:", error);
    return [];
  } finally {
    await page.close();
  }
};

/** Scraping de jugadores desde la página del equipo */
const scrapePlayersFromTeam = async (teamUrl, browser) => {
  console.log(`🔍 Extrayendo jugadores de ${teamUrl}...`);
  const page = await preparePage(browser);
  try {
    await page.goto(teamUrl, { waitUntil: "domcontentloaded" });

    const squadButton = await page.$('h2[data-tabid="squad"]');
    if (squadButton) {
      await squadButton.click();
      await page
        .waitForSelector(".Text.ietnEf", { timeout: 10000 })
        .catch(() => console.log("⚠️ No se encontraron jugadores."));
    }

    const players = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".Text.ietnEf"))
        .map((el) => {
          const name = el.innerText.trim();
          const linkElement = el.closest("a");
          const link = linkElement
            ? "https://www.sofascore.com" + linkElement.getAttribute("href")
            : null;
          return link ? { name, link } : null;
        })
        .filter(Boolean);
    });

    console.log(`✅ ${players.length} jugadores extraídos.`);
    return players;
  } catch (error) {
    console.error("❌ Error al extraer jugadores:", error);
    return [];
  } finally {
    await page.close();
  }
};


// Función de clic con reintentos y verificación de visibilidad
const attemptClick = async (page, selector, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await page.waitForSelector(selector, { visible: true, timeout: 5000 });
      await slowClickElement(page, selector);
      return;
    } catch (error) {
      console.warn(
        `⚠️ Intento ${attempt} fallido para hacer clic en: ${selector}`
      );
      if (attempt === maxAttempts)
        throw new Error(`❌ No se pudo hacer clic en: ${selector}`);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
};

// Función de slow click que se asegura de que el elemento esté visible y en el viewport
const slowClickElement = async (page, selector, delayTime = 500) => {
  const element = await page.waitForSelector(selector, {
    visible: true,
    timeout: 30000,
  });
  if (!element) throw new Error(`No se encontró el selector: ${selector}`);

  await page.evaluate(
    (el) => el.scrollIntoView({ block: "nearest", inline: "center" }),
    element
  );
  await new Promise((r) => setTimeout(r, delayTime));

  const box = await element.boundingBox();
  if (!box) throw new Error(`No se pudo obtener bounding box de ${selector}`);

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.move(x - 10, y - 10);
  await new Promise((r) => setTimeout(r, 300));

  await page.mouse.move(x, y);
  await new Promise((r) => setTimeout(r, delayTime));
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, delayTime));
  await page.mouse.up();
};

const scrollPageToPosition = async (page, scrollAmount = 500) => {
  console.log("🔄 Realizando scroll en la página...");
  await page.evaluate(async (amount) => {
    window.scrollBy({ top: amount, behavior: "smooth" });
    await new Promise((resolve) => setTimeout(resolve, 500)); // Esperar medio segundo después del scroll
  }, scrollAmount);
  console.log("✅ Scroll completado.");
};

const waitForElement = async (page, selector, timeout = 5000) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    console.log(`✅ Elemento encontrado: ${selector}`);
    return true;
  } catch (error) {
    console.error(`❌ Elemento no encontrado: ${selector}`);
    return false;
  }
};

const MAX_ATTEMPTS = 3;

const safeWaitForElement = async (page, selector, timeout = 5000) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    console.log(`✅ Elemento encontrado: ${selector}`);
    return true;
  } catch (error) {
    console.error(`❌ Elemento no encontrado: ${selector}`);
    return false;
  }
};

const openDropdown = async (page) => {
  const dropdownButtonSelector = "div.Dropdown.gSFIyj button.DropdownButton.jQruaf";
  const optionsContainerSelector = "ul.Box.klGMtt";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    console.log(`🔄 [Intento ${attempt}] Abriendo dropdown...`);
    try {
      await page.click(dropdownButtonSelector);
    } catch (e) {
      console.error(`Error al hacer click en dropdown: ${e}`);
    }
    await new Promise((r) => setTimeout(r, 1000)); // Espera para que se abra

    const isOptionsVisible = await safeWaitForElement(page, optionsContainerSelector, 5000);
    if (isOptionsVisible) {
      console.log(`✅ Dropdown abierto en el intento ${attempt}.`);
      return true;
    }
    console.log(`⚠️ Dropdown no se abrió en el intento ${attempt}.`);
  }

  console.log("❌ No se pudo abrir el dropdown tras varios intentos.");
  return false;
};

const scrapeTournamentStats = async (page) => {
  try {
    await scrollPageToPosition(page, 200);
    const optionsContainerSelector = "ul.Box.klGMtt";
    const optionSelector = "li.DropdownItem";

    // Intentamos abrir el dropdown
    const dropdownOpened = await openDropdown(page);
    if (!dropdownOpened) {
      console.log("⚠️ No se pudo abrir el dropdown, usando competición por defecto.");
      return { Default: await extractAccordionData(page) };
    }

    console.log("🔍 Extrayendo competiciones disponibles...");
    const competitions = await page.$$eval(
      `${optionsContainerSelector} ${optionSelector}`,
      (options) =>
        options.map(
          (option) =>
            option.querySelector("bdi.Text.jFxLbA")?.textContent.trim() || "Unknown"
        )
    );

    if (competitions.length === 0) {
      console.log("⚠️ No hay competiciones, usando default.");
      return { Default: await extractAccordionData(page) };
    }

    console.log("✅ Competiciones detectadas:", competitions);
    const allStats = {};

    for (let i = 0; i < competitions.length; i++) {
      const competitionName = competitions[i];
      console.log(`🔄 Seleccionando competición: ${competitionName}...`);

      let selected = false;
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        console.log(`🔍 [Intento ${attempt}] Abriendo dropdown para ${competitionName}...`);
        const dropdownOpened = await openDropdown(page);
        if (!dropdownOpened) {
          console.log(`⚠️ No se pudo abrir el dropdown para ${competitionName} en el intento ${attempt}.`);
          continue;
        }

        const optionSelectorFull = `${optionsContainerSelector} ${optionSelector}:nth-of-type(${i + 1})`;
        const optionExists = await safeWaitForElement(page, optionSelectorFull, 5000);
        if (optionExists) {
          await page.click(optionSelectorFull);
          console.log(`✅ Seleccionado: ${competitionName}`);
          await new Promise((r) => setTimeout(r, 1200)); // Esperar para carga
          allStats[competitionName] = await extractAccordionData(page);
          selected = true;
          break;
        } else {
          console.log(`⚠️ No se encontró la opción ${competitionName} en el intento ${attempt}.`);
        }
      }

      if (!selected) {
        console.log(`❌ Falló la selección de ${competitionName} tras varios intentos.`);
      }
    }

    return allStats;
  } catch (error) {
    console.error("❌ Error en el scraping:", error);
    return null;
  }
};

/** Scraping de estadísticas de jugadores (usando únicamente Sofascore) */
const scrapePlayerStats = async (playerUrl, browser) => {
  console.log(`🔍 Extrayendo estadísticas de ${playerUrl}...`);
  const page = await browser.newPage();
  await page.setViewport({ width: 670, height: 599 });
  page.setDefaultTimeout(LONG_TIMEOUT);
  try {
    await page.goto(playerUrl, { waitUntil: "networkidle2" });

    let playerStats = { url: playerUrl };

    console.log("📜 Desplazando lentamente hasta la posición del jugador...");
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= 500) {
            clearInterval(timer);
            resolve();
          }
        }, 500);
      });
    });
    await delay(1000);

    // Reintentar extraer la posición hasta 3 veces si sigue siendo "Unknown"
    let attempts = 3;
    let position = "Unknown";
    while (attempts > 0) {
      position = await safeEvaluate(page, () => {
        const positionElement = document.querySelector(
          "g.sc-f11cf694-0.NMCYM text"
        );
        return positionElement ? positionElement.textContent.trim() : "Unknown";
      });
      if (position !== "Unknown") break;
      console.log(
        `🔄 Posición sigue siendo Unknown, reintentando... (${
          attempts - 1
        } intentos restantes)`
      );
      await delay(1000);
      attempts--;
    }
    playerStats.position = position;
    console.log(`🔎 Posición detectada: ${playerStats.position}`);

    // 1. Cambiar a la pestaña de estadísticas
    const statisticsButton = await page.$('h2[data-tabid="statistics"]');
    if (statisticsButton) {
      await statisticsButton.click();
      console.log("✅ Cambiando a la pestaña de estadísticas...");
    } else {
      console.log("⚠️ No se encontró la pestaña 'Statistics'");
      throw new Error("No se encontró la pestaña de estadísticas");
    }

    // 2. Extraer estadísticas de todas las competiciones
    const allStats = await scrapeTournamentStats(page);
    if (allStats) {
      playerStats.competitions = allStats;

      // Inicializar acumuladores
      const accumulated = {
        matches: 0,
        minutesPlayed: 0,
        goals: 0,
        expectedGoals: 0,  // Se acumulará para promediar
        assists: 0,
        expectedAssists: 0,  // Se acumulará para promediar
        shots: 0,
        shotsOnTarget: 0,
        passAccuracy: 0,
        dribbles: 0,
        fouls: 0,
        yellowCards: 0,
        redCards: 0,
        competitionCount: 0
      };

      // Procesar cada competición
      for (const competitionStats of Object.values(allStats)) {
        if (!competitionStats || competitionStats.length === 0) continue;

        // Unificar estadísticas de esta competición
        const stats = {};
        competitionStats.forEach(group => {
          Object.entries(group).forEach(([key, value]) => {
            stats[key] = value;
          });
        });

        // Función para parsear valores numéricos
        const parseStat = (statName) => {
          if (!stats[statName]) return 0;
          const strValue = stats[statName].trim();
          if (strValue === "" || strValue === "-") return 0;
          return parseFloat(strValue.replace(',', '.')) || 0;
        };

        // Acumular valores
        accumulated.matches += parseStat("Total played");
        accumulated.minutesPlayed += parseStat("Total minutes played");
        accumulated.goals += parseStat("Goals");
        accumulated.expectedGoals += parseStat("Expected Goals (xG)"); // Acumula para promedio
        accumulated.assists += parseStat("Assists");
        accumulated.expectedAssists += parseStat("Expected Assists (xA)"); // Acumula para promedio
        accumulated.yellowCards += parseStat("Yellow");
        accumulated.redCards += parseStat("Red");
        accumulated.fouls += parseStat("Fouls");

        // Para estadísticas que son promedios por partido
        accumulated.shots += parseStat("Shots per game");
        accumulated.shotsOnTarget += parseStat("Shots on target per game");
        accumulated.passAccuracy += parseStat("Accurate per game");
        accumulated.dribbles += parseStat("Succ. dribbles");
        
        accumulated.competitionCount++;
      }

      // Asignar valores finales al playerStats
      playerStats.matches = accumulated.matches;
      playerStats.minutesPlayed = accumulated.minutesPlayed;
      playerStats.goals = accumulated.goals;
      playerStats.assists = accumulated.assists;
      playerStats.yellowCards = accumulated.yellowCards;
      playerStats.redCards = accumulated.redCards;
      playerStats.fouls = accumulated.fouls;

      // Calcular promedios para las estadísticas correspondientes
      if (accumulated.competitionCount > 0) {
        playerStats.expectedGoals = accumulated.expectedGoals / accumulated.competitionCount;
        playerStats.expectedAssists = accumulated.expectedAssists / accumulated.competitionCount;
        playerStats.shots = accumulated.shots / accumulated.competitionCount;
        playerStats.shotsOnTarget = accumulated.shotsOnTarget / accumulated.competitionCount;
        playerStats.passAccuracy = accumulated.passAccuracy / accumulated.competitionCount;
        playerStats.dribbles = accumulated.dribbles / accumulated.competitionCount;
      }
    }

    // Extraer rating
    playerStats.rating = await safeEvaluate(page, () => {
      const ratingElement = document.querySelector(
        "div.Box.klGMtt.sc-eldPxv span, div.Box.klGMtt.sc-eldPxv.iEqRKR.animation-complete span, div.Box.klGMtt.sc-eldPxv.hXTPqq.animation-complete span"
      );
      return ratingElement
        ? parseFloat(ratingElement.textContent.trim())
        : null;
    });
    console.log(`⭐ Rating detectado: ${playerStats.rating}`);

    console.log("✅ Estadísticas completas obtenidas:", playerStats);
    return playerStats;
  } catch (error) {
    console.error("❌ Error al extraer estadísticas:", error);
    return {
      url: playerUrl,
      position: "Unknown",
      rating: null,
      error: error.message,
    };
  } finally {
    await page.close();
  }
};

/** Función para extraer las estadísticas de cada jugador de forma individual (secuencial) */
async function scrapeStatsForTeam(players, browser) {
  const results = [];
  for (const player of players) {
    try {
      console.log(`Procesando estadísticas para ${player.name}...`);
      const stats = await scrapePlayerStats(player.link, browser);
      results.push({ name: player.name, stats });
    } catch (error) {
      console.error(
        `Error extrayendo estadísticas para ${player.name}:`,
        error
      );
      results.push({
        name: player.name,
        stats: {
          url: player.link,
          position: "Unknown",
          rating: null,
          error: error.message,
        },
      });
    }
  }
  return results;
}

module.exports = {
  scrapeTeamsFromSofascore,
  scrapePlayersFromTeam,
  scrapePlayerStats,
  scrapeStatsForTeam, // Esta función procesa cada jugador de forma individual
};
