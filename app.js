/**
 * App.js - Lógica del Visualizador de la Penka Mundial 2026
 * Maneja la inicialización de los datos locales, la generación del gráfico SVG y los paneles del dashboard.
 */

document.addEventListener("DOMContentLoaded", () => {
  // --- Elementos del DOM ---
  const chartContainer = document.getElementById("chart-container");
  const tooltip = document.getElementById("chart-tooltip");
  const legendContainer = document.getElementById("legend-container");
  
  // Premios en Cabecera
  const headerPrizes = document.getElementById("header-prizes");
  
  // Métricas
  const leaderEfficiencyVal = document.getElementById("leader-efficiency-val");
  const leaderEfficiencySub = document.getElementById("leader-efficiency-sub");
  const leaderProgressMax = document.getElementById("leader-progress-max");
  const leaderProgressBar = document.getElementById("leader-progress-bar");
  const trendsTextContainer = document.getElementById("trends-text-container");

  // --- Estado de la Aplicación ---
  let state = {
    data: null, // Datos activos procesados
    chartType: "cumulative",
    hoveredPlayer: null
  };

  // --- Paleta de Colores de Líneas ---
  const colors = [
    "#FFC72C", // Oro (1º)
    "#A9D3E0", // Plata (2º)
    "#E29578", // Bronce (3º)
    "#4EA8DE", "#56CFE1", "#64DFDF", "#72EFDD",
    "#D81159", "#8F2D56", "#218380", "#FBB13C",
    "#735CDD", "#9A031E", "#3F37C9", "#4CC9F0"
  ];

  // --- Inicialización ---
  function init() {
    setupEventListeners();
    loadLocalData();
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    // Responsividad: Redibujar al cambiar tamaño de pantalla
    window.addEventListener("resize", debounce(() => {
      if (state.data) renderDashboard();
    }, 150));
  }

  // --- Carga de Datos Locales ---
  function loadLocalData() {
    // Hacemos una copia profunda de los datos cargados desde data.js
    const dataCopy = JSON.parse(JSON.stringify(DEMO_DATA));
    processPoints(dataCopy.players);
    state.data = dataCopy;
    renderRules();
    renderDashboard();
  }

  // --- Procesamiento de Puntos (Acumulativo vs Partido) ---
  function processPoints(players) {
    players.forEach(player => {
      // Detección automática: si todos los valores son no-decrecientes, asumimos acumulados
      let isCumulative = true;
      for (let i = 1; i < player.points.length; i++) {
        if (player.points[i] < player.points[i - 1]) {
          isCumulative = false;
          break;
        }
      }

      if (isCumulative) {
        player.cumulative = [...player.points];
        player.single = player.points.map((p, idx) => idx === 0 ? p : p - player.points[idx - 1]);
      } else {
        player.single = [...player.points];
        let sum = 0;
        player.cumulative = player.points.map(p => {
          sum += p;
          return sum;
        });
      }
    });
  }

  // --- Renderizado de Paneles Laterales ---
  function renderRules() {
    const rules = state.data.rules;
    if (!rules || !headerPrizes) return;

    // Premios en la Cabecera
    headerPrizes.innerHTML = rules.prizes.map(p => `
      <div class="prize-badge">
        <span>${p.icon}</span>
        <span class="prize-rank">${p.rank}:</span>
        <span class="prize-val">${p.value}</span>
      </div>
    `).join("");
  }

  // --- Renderizado del Dashboard Completo ---
  function renderDashboard() {
    if (!state.data) return;

    // 1. Obtener puntuación actual de los jugadores (para ordenar tabla y ranking)
    const players = state.data.players.map(p => {
      const activePointsArray = state.chartType === "cumulative" ? p.cumulative : p.single;
      const currentPoints = activePointsArray[activePointsArray.length - 1] || 0;
      return {
        ...p,
        activePoints: activePointsArray,
        currentPoints: currentPoints
      };
    });

    // Ordenar jugadores de mayor a menor puntuación actual
    players.sort((a, b) => b.currentPoints - a.currentPoints);

    // Asignar colores de acuerdo al ranking actual (para destacar líder, segundo, tercero)
    players.forEach((p, idx) => {
      p.color = colors[idx % colors.length];
      p.rank = idx + 1;
    });

    // Renderizar gráfico SVG
    renderSVGChart(players);

    // Renderizar leyenda interactiva
    renderLegend(players);

    // Renderizar métricas y análisis de tendencias
    renderTrends(players);
  }

  // --- Renderizar Gráfico SVG ---
  function renderSVGChart(players) {
    chartContainer.innerHTML = ""; // Limpiar
    
    const containerWidth = chartContainer.clientWidth;
    const containerHeight = chartContainer.clientHeight;
    
    // Viewport SVG base
    const svgWidth = 800;
    const svgHeight = 480;
    
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${svgWidth} ${svgHeight}`);
    svg.setAttribute("class", "main-svg");
    
    // Definiciones (gradientes y filtros)
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <linearGradient id="asadoGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--accent-danger)" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="var(--accent-danger)" stop-opacity="0.0"/>
      </linearGradient>
      <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.3"/>
      </filter>
    `;
    svg.appendChild(defs);

    // Configuración de Márgenes y Límites del gráfico
    const margin = { top: 50, right: 180, bottom: 40, left: 45 };
    const chartW = svgWidth - margin.left - margin.right;
    const chartH = svgHeight - margin.top - margin.bottom;

    const numMatches = state.data.headers.length;
    
    // Calcular puntaje máximo para el eje Y
    let maxVal = 10;
    players.forEach(p => {
      const localMax = Math.max(...p.activePoints);
      if (localMax > maxVal) maxVal = localMax;
    });
    // Redondear al siguiente múltiplo de 5
    const yMaxLimit = Math.ceil(maxVal / 5) * 5;

    // Funciones de mapeo de coordenadas
    const getX = (matchIdx) => margin.left + (matchIdx * (chartW / (numMatches - 1)));
    const getY = (val) => margin.top + chartH - (val * (chartH / yMaxLimit));

    // 1. Dibujar líneas de cuadrícula Y (y etiquetas)
    const gridCount = yMaxLimit / 5;
    for (let i = 0; i <= gridCount; i++) {
      const val = i * 5;
      const y = getY(val);
      
      // Línea de la cuadrícula
      const gridLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
      gridLine.setAttribute("x1", margin.left);
      gridLine.setAttribute("y1", y);
      gridLine.setAttribute("x2", margin.left + chartW);
      gridLine.setAttribute("y2", y);
      gridLine.setAttribute("class", "chart-grid-line " + (val === 0 ? "" : "dash"));
      svg.appendChild(gridLine);
      
      // Etiqueta Y
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", margin.left - 10);
      text.setAttribute("y", y + 4);
      text.setAttribute("text-anchor", "end");
      text.setAttribute("class", "chart-axis-label");
      text.textContent = val;
      svg.appendChild(text);
    }

    // Eje X: Etiquetas (P1, P2...)
    state.data.headers.forEach((h, idx) => {
      const x = getX(idx);
      
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", x);
      text.setAttribute("y", margin.top + chartH + 20);
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("class", "chart-axis-label");
      text.textContent = h;
      svg.appendChild(text);
    });

    // Título de los ejes en el SVG
    const yTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yTitle.setAttribute("transform", `rotate(-90)`);
    yTitle.setAttribute("x", -(margin.top + chartH / 2));
    yTitle.setAttribute("y", 12);
    yTitle.setAttribute("text-anchor", "middle");
    yTitle.setAttribute("fill", "var(--text-muted)");
    yTitle.setAttribute("font-size", "9px");
    yTitle.setAttribute("font-weight", "600");
    yTitle.setAttribute("letter-spacing", "0.5px");
    yTitle.textContent = state.chartType === "cumulative" ? "PUNTOS ACUMULADOS" : "PUNTOS POR PARTIDO";
    svg.appendChild(yTitle);

    const xTitle = document.createElementNS("http://www.w3.org/2000/svg", "text");
    xTitle.setAttribute("x", margin.left + chartW / 2);
    xTitle.setAttribute("y", svgHeight - 8);
    xTitle.setAttribute("text-anchor", "middle");
    xTitle.setAttribute("fill", "var(--text-muted)");
    xTitle.setAttribute("font-size", "9px");
    xTitle.setAttribute("font-weight", "600");
    xTitle.setAttribute("letter-spacing", "0.5px");
    xTitle.textContent = "PARTIDOS JUGADOS";
    svg.appendChild(xTitle);

    // 2. Dibujar "Zona del Asado"
    // Solo aplica para la vista acumulativa
    if (state.chartType === "cumulative" && players.length >= 5) {
      // Filtrar los que participan en el asado
      const asadoPlayers = players.filter(p => p.participatesInAsado !== false);
      // Para cada partido j, encontramos el umbral que define a los 5 últimos jugadores
      const asadoPointsPath = [];
      for (let j = 0; j < numMatches; j++) {
        // Obtener puntuaciones de los participantes activos del asado
        const roundScores = asadoPlayers.map(p => p.activePoints[j] || 0);
        roundScores.sort((a, b) => a - b); // De menor a mayor
        // El umbral es el valor del 5º jugador desde abajo
        const threshold = roundScores[Math.min(4, roundScores.length - 1)] || 0;
        asadoPointsPath.push({ x: getX(j), y: getY(threshold) });
      }

      // Crear el path del polígono
      let polygonD = `M ${getX(0)} ${margin.top + chartH} `;
      asadoPointsPath.forEach(pt => {
        polygonD += `L ${pt.x} ${pt.y} `;
      });
      polygonD += `L ${getX(numMatches - 1)} ${margin.top + chartH} Z`;

      const asadoZone = document.createElementNS("http://www.w3.org/2000/svg", "path");
      asadoZone.setAttribute("d", polygonD);
      asadoZone.setAttribute("class", "asado-zone-svg");
      svg.appendChild(asadoZone);


    }

    // 3. Dibujar las líneas de los jugadores
    players.forEach((player) => {
      let d = "";
      player.activePoints.forEach((val, idx) => {
        const x = getX(idx);
        const y = getY(val);
        d += (idx === 0 ? "M" : "L") + ` ${x} ${y}`;
      });

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "player-line");
      path.setAttribute("id", `line-${normalizeId(player.name)}`);
      path.setAttribute("stroke", player.color);
      path.setAttribute("stroke-width", player.rank <= 3 ? "2.5px" : "1.5px");
      
      // Aplicar muting o resaltado inicial según estado
      if (state.hoveredPlayer) {
        if (state.hoveredPlayer === player.name) {
          path.classList.add("highlighted");
        } else {
          path.classList.add("muted");
        }
      }

      // Eventos interactivos en la línea
      path.addEventListener("mouseenter", () => highlightPlayer(player.name));
      path.addEventListener("mouseleave", () => resetHighlight());

      svg.appendChild(path);
    });

    // 4. Dibujar círculos invisibles de interacción (para tooltips precisos)
    players.forEach((player) => {
      player.activePoints.forEach((val, idx) => {
        const x = getX(idx);
        const y = getY(val);

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 4);
        circle.setAttribute("fill", player.color);
        circle.setAttribute("stroke", "#ffffff");
        circle.setAttribute("stroke-width", "1px");
        circle.setAttribute("opacity", "0");
        circle.setAttribute("style", "cursor: pointer; pointer-events: all;");

        // Mostrar con opacidad baja al pasar por encima del área
        circle.addEventListener("mouseenter", (e) => {
          highlightPlayer(player.name);
          circle.setAttribute("opacity", "1");
          circle.setAttribute("r", 6);
          showTooltip(e, player, idx, val);
        });

        circle.addEventListener("mouseleave", () => {
          resetHighlight();
          circle.setAttribute("opacity", "0");
          circle.setAttribute("r", 4);
          hideTooltip();
        });

        svg.appendChild(circle);
      });
    });

    // 5. Dibujar etiquetas de nombres de jugadores al final de sus líneas
    // Para evitar superposiciones, podemos ordenar los nombres y sus posiciones de manera limpia.
    const lastX = getX(numMatches - 1);
    
    // Creamos objetos para posicionar
    const labelPositions = players.map(p => {
      const lastVal = p.activePoints[p.activePoints.length - 1] || 0;
      return {
        name: p.name,
        color: p.color,
        val: lastVal,
        y: getY(lastVal),
        targetY: getY(lastVal),
        rank: p.rank
      };
    });

    // Resolver colisiones básico (barrido vertical de abajo a arriba)
    labelPositions.sort((a, b) => a.targetY - b.targetY); // De arriba a abajo en SVG (0 es arriba)
    const minSpacing = 13; // Espacio mínimo entre textos en px
    for (let i = 1; i < labelPositions.length; i++) {
      if (labelPositions[i].targetY - labelPositions[i - 1].targetY < minSpacing) {
        labelPositions[i].targetY = labelPositions[i - 1].targetY + minSpacing;
      }
    }
    // Asegurar que no se salgan por abajo
    const maxAllowedY = margin.top + chartH + 5;
    if (labelPositions[labelPositions.length - 1].targetY > maxAllowedY) {
      labelPositions[labelPositions.length - 1].targetY = maxAllowedY;
      for (let i = labelPositions.length - 2; i >= 0; i--) {
        if (labelPositions[i + 1].targetY - labelPositions[i].targetY < minSpacing) {
          labelPositions[i].targetY = labelPositions[i + 1].targetY - minSpacing;
        }
      }
    }

    // Dibujar las etiquetas
    labelPositions.forEach(lbl => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "player-label-group");
      g.setAttribute("style", "cursor: pointer;");
      g.addEventListener("mouseenter", () => highlightPlayer(lbl.name));
      g.addEventListener("mouseleave", () => resetHighlight());

      // Puntos/Medalla de posición
      let medal = "";
      if (state.chartType === "cumulative") {
        if (lbl.rank === 1) medal = "🥇 ";
        else if (lbl.rank === 2) medal = "🥈 ";
        else if (lbl.rank === 3) medal = "🥉 ";
      }

      // Línea de guía muy tenue si la etiqueta se movió de su posición original
      if (Math.abs(lbl.y - lbl.targetY) > 2) {
        const guide = document.createElementNS("http://www.w3.org/2000/svg", "path");
        guide.setAttribute("d", `M ${lastX} ${lbl.y} L ${lastX + 6} ${lbl.targetY}`);
        guide.setAttribute("stroke", "rgba(255, 255, 255, 0.15)");
        guide.setAttribute("stroke-width", "0.75px");
        guide.setAttribute("fill", "none");
        g.appendChild(guide);
      }

      // Texto del Jugador
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", lastX + 10);
      text.setAttribute("y", lbl.targetY + 3);
      text.setAttribute("fill", state.hoveredPlayer && state.hoveredPlayer !== lbl.name ? "var(--text-muted)" : "var(--text-primary)");
      text.setAttribute("font-weight", lbl.rank <= 3 ? "700" : "500");
      text.setAttribute("font-size", "10px");
      text.setAttribute("class", "player-text-label");
      
      // Colorear el texto de los 3 primeros
      if (lbl.rank === 1) text.setAttribute("fill", "var(--accent-gold)");
      
      text.textContent = `${medal}${lbl.name} (${lbl.val})`;
      g.appendChild(text);
      svg.appendChild(g);
    });



    chartContainer.appendChild(svg);
  }

  // --- Renderizar Leyenda de Jugadores ---
  function renderLegend(players) {
    legendContainer.innerHTML = "";
    
    players.forEach(p => {
      const item = document.createElement("div");
      item.setAttribute("class", `legend-item ${state.hoveredPlayer === p.name ? "highlighted" : ""}`);
      item.addEventListener("mouseenter", () => highlightPlayer(p.name));
      item.addEventListener("mouseleave", () => resetHighlight());

      item.innerHTML = `
        <div class="legend-player-info">
          <span class="legend-color-dot" style="background-color: ${p.color};"></span>
          <span>${p.rank}. ${p.name}</span>
        </div>
        <div class="legend-score">
          ${p.currentPoints} pts
        </div>
      `;

      legendContainer.appendChild(item);
    });
  }

  // --- Calcular y Renderizar Tendencias ---
  function renderTrends(players) {
    if (players.length === 0) return;

    const leader = players[0];
    const second = players[1] || leader;
    const worst = players[players.length - 1];

    const totalMatches = state.data.headers.length;
    // Puntos máximos posibles acumulados (16 partidos * 5 puntos)
    const maxPossiblePoints = totalMatches * 5; 
    const leaderEff = ((leader.currentPoints / maxPossiblePoints) * 100).toFixed(1);

    // 1. Mostrar Eficiencia del Líder en la tarjeta métrica
    leaderEfficiencyVal.textContent = `${leaderEff}%`;
    leaderEfficiencySub.textContent = `(${leader.currentPoints}/${maxPossiblePoints} pts)`;
    
    // Barra de progreso de la métrica
    leaderProgressMax.textContent = `${maxPossiblePoints} pts`;
    if (leaderProgressBar) {
      leaderProgressBar.style.width = `${leaderEff}%`;
    }

    // 2. Generar el Texto de Análisis de Tendencias
    let htmlText = "";
    
    if (state.chartType === "cumulative") {
      const diff = leader.currentPoints - second.currentPoints;
      // Filtrar los que participan en el asado
      const asadoPlayers = players.filter(p => p.participatesInAsado !== false);
      const warningLimit = Math.max(0, asadoPlayers.length - 5);
      const asadoCandidates = asadoPlayers.slice(warningLimit);

      htmlText += `
        <p>🥇 <strong>Consistencia Clave:</strong> La regularidad en aciertos de <strong>${leader.name}</strong> le permite mantenerse en la cima con una ventaja de <strong>+${diff} puntos</strong> sobre su perseguidor más cercano, ${second.name}.</p>
      `;

      if (asadoCandidates.length > 0) {
        const names = asadoCandidates.map(c => c.name).join(", ");
        htmlText += `
          <p>🔥 <strong>Zona de Peligro (Asado):</strong> Actualmente, los últimos participantes activos del castigo (<strong>${names}</strong>) están en la zona roja. Necesitan una excelente racha en los próximos encuentros para salvarse del gasto obligatorio.</p>
        `;
      }

      // Buscar si hay algún jugador con buena racha
      // Racha: últimos 4 partidos sumando buenos puntos
      const streakPlayers = players.map(p => {
        const last4 = p.activePoints.slice(-4);
        let diffSum = 0;
        if (last4.length >= 4) {
          // Calculamos cuánto sumó en los últimos 4 partidos
          const pStart = p.activePoints[p.activePoints.length - 5] || 0;
          const pEnd = p.activePoints[p.activePoints.length - 1];
          diffSum = pEnd - pStart;
        }
        return { name: p.name, streakPoints: diffSum };
      }).sort((a, b) => b.streakPoints - a.streakPoints);

      if (streakPlayers[0] && streakPlayers[0].streakPoints > 5) {
        htmlText += `
          <p>📈 <strong>Racha Fuerte:</strong> <strong>${streakPlayers[0].name}</strong> ha estado encendido, acumulando <strong>+${streakPlayers[0].streakPoints} puntos</strong> en las últimas 4 jornadas y escalando en la tabla.</p>
        `;
      }
    } else {
      // Gráfico individual (Puntos por partido)
      // Encontrar quién tuvo el partido con mayor puntaje individual
      let bestMatchPoints = 0;
      let bestMatchPlayer = "";
      let bestMatchName = "";

      players.forEach(p => {
        p.activePoints.forEach((pts, idx) => {
          if (pts > bestMatchPoints) {
            bestMatchPoints = pts;
            bestMatchPlayer = p.name;
            bestMatchName = state.data.headers[idx];
          }
        });
      });

      htmlText += `
        <p>⚡ <strong>Récord de Jornada:</strong> El mayor puntaje obtenido en un solo partido fue de <strong>${bestMatchPoints} puntos</strong> por <strong>${bestMatchPlayer}</strong> durante la jornada <strong>${bestMatchName}</strong>.</p>
        <p>📊 <strong>Distribución:</strong> Este gráfico muestra los aciertos exactos y aproximados fecha a fecha, permitiendo visualizar los picos de rendimiento e inconstancia de cada participante.</p>
      `;
    }

    trendsTextContainer.innerHTML = htmlText;
  }

  // --- Funciones Auxiliares de Interacción ---
  function highlightPlayer(name) {
    state.hoveredPlayer = name;
    
    // Resaltar en el SVG
    const lines = document.querySelectorAll(".player-line");
    const targetLineId = `line-${normalizeId(name)}`;
    
    lines.forEach(line => {
      if (line.id === targetLineId) {
        line.classList.add("highlighted");
        line.classList.remove("muted");
      } else {
        line.classList.add("muted");
        line.classList.remove("highlighted");
      }
    });

    // Resaltar leyenda
    const legendItems = document.querySelectorAll(".legend-item");
    legendItems.forEach(item => {
      const playerNameSpan = item.querySelector(".legend-player-info span:last-child");
      if (playerNameSpan && playerNameSpan.textContent.includes(name)) {
        item.classList.add("highlighted");
      } else {
        item.classList.remove("highlighted");
      }
    });
  }

  function resetHighlight() {
    state.hoveredPlayer = null;
    
    // Quitar clases en SVG
    const lines = document.querySelectorAll(".player-line");
    lines.forEach(line => {
      line.classList.remove("highlighted", "muted");
    });

    // Quitar clases en leyenda
    const legendItems = document.querySelectorAll(".legend-item");
    legendItems.forEach(item => {
      item.classList.remove("highlighted");
    });
  }

  // --- Tooltips del Gráfico ---
  function showTooltip(e, player, matchIdx, value) {
    const matchName = state.data.headers[matchIdx];
    
    // Obtener la posición del cursor respecto al contenedor del gráfico
    const rect = chartContainer.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top - 15;

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
    tooltip.style.display = "block";
    
    // Tipo de puntos
    const typeLabel = state.chartType === "cumulative" ? "Acumulado" : "Jornada";

    tooltip.innerHTML = `
      <div class="tooltip-player">
        <span class="legend-color-dot" style="background-color: ${player.color};"></span>
        <strong>${player.name}</strong>
      </div>
      <div>Partido: <strong>${matchName}</strong></div>
      <div>Puntos ${typeLabel}: <strong>${value} pts</strong></div>
      ${state.chartType === "cumulative" ? `<div>Puesto actual: <strong>${player.rank}º</strong></div>` : ""}
    `;
  }

  function hideTooltip() {
    tooltip.style.display = "none";
  }

  // --- Utilidades ---
  function normalizeId(string) {
    return string.toLowerCase().replace(/[^a-z0-9]/g, "-");
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }



  // Arrancar la aplicación
  init();
});
