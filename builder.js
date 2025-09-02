/* =========================================================
   Nexo de Esencias — Builder (builder.js)
   Cambios en esta versión:
   - Mantiene estado de colapsables (no se cierran al comprar/quitar)
   - Mantiene scroll al comprar/quitar/asignar
   - Barra de búsqueda reubicada antes del mercado de esencias
   - Export PDF: pagebreak limpio + estilo más bonito (no corta líneas)
========================================================= */

/* ---------- Config ---------- */

/* ---------- Helpers (mercado) ---------- */
function getPerCharMax(item){
  if (item && typeof item.perCharMax === 'number') return item.perCharMax;
  if (!item || !item.nombre) return 1;
  return /expansi[oó]n\s*de\s*nexo/i.test(item.nombre) ? 2 : 1;
}
const COSTO_SLOT = 4;

const CONSTELACIONES = [
  { name: "Furia", color: "#e74c3c" },       // Roja
  { name: "Control", color: "#2980b9" },     // Azul
  { name: "Adaptación", color: "#8b5a2b" },  // Café
  { name: "Corrupción", color: "#2c3e50" },  // Negra
  { name: "Protección", color: "#f1c40f" },  // Amarilla
  { name: "Creación", color: "#27ae60" },    // Verde
  { name: "Destino", color: "#6b0b24" },     // Burdeo
  { name: "Vínculo", color: "#8E44AD" }      // Vinculadas (no cuentan)
];

const RULES = {
  "Furia": { 
    affinity: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
    affText: [
      "+5 pies a tu velocidad de movimiento.",
      "Obtienes ventaja en las tiradas para evitar ser derribado.",
      "Añades tu modificador de Fuerza a las tiradas de Intimidación.",
      "Ganas resistencia al daño por frío.",
      "Una vez por turno, puedes añadir 1d4 de daño de fuego a un ataque con arma que impacte.",
      "Ignoras el terreno difícil.",
      "Cuando un enemigo falla un ataque cuerpo a cuerpo contra ti, puedes usar tu reacción para intentar derribarlo.",
      "El dado de daño de la afinidad de 6 esencias aumenta a 1d6.",
      "Eres inmune a la condición de asustado (frightened).",
      "Cuando dejas a un enemigo en 0 HP con un ataque cuerpo a cuerpo, ganas puntos de vida temporales iguales a tu nivel.",
      "Tu puntuación de Fuerza aumenta en 2."
    ], 
    domain: [4, 8, 12], 
    domText: [
      "Una vez por descanso corto, cuando fallas una tirada de ataque con un arma, puedes elegir repetirla.",
      "Cuando un enemigo te golpea con un ataque cuerpo a cuerpo, puedes usar tu reacción para infligirle 2d6 de daño de fuego.",
      "Obtienes una acción adicional durante tu primer turno de cada combate."
    ] 
  },
  "Control":  { 
    affinity: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
    affText: [
      "Ganas un +1 a las tiradas de salvación de Sabiduría.",
      "Tienes ventaja en las tiradas de Carisma (Engañar) para contar una mentira convincente.",
      "Obtienes resistencia al daño psíquico.",
      "Puedes entender todos los idiomas hablados.",
      "Una vez por turno, cuando una criatura te falla un ataque, puedes usar tu reacción para forzar a que ese ataque se redirija a otra criatura a 5 pies de ti.",
      "Eres inmune a la lectura de tus pensamientos.",
      "La primera vez que una criatura te inflige daño en un combate, su velocidad se reduce a la mitad hasta el final de su próximo turno.",
      "El alcance y area de efecto de tus esencias aumenta en 5 pies. Tus esencias de toque pasan a tener rango 5.",
      "Eres inmune a la condición de hechizado (charmed).",
      "Cuando una criatura falla una tirada de salvación contra una de tus esencias, tiene una penalización de -1 a sus tiradas de salvación durante 1 minuto.",
      "Tu puntuación de Inteligencia, Sabiduría o Carisma (tu elección al obtener este bono) aumenta en 2."
    ], 
    domain: [4, 8, 12], 
    domText: [
      "Una vez por descanso corto, cuando fallas una tirada de salvación de Inteligencia, Sabiduría o Carisma, puedes elegir repetirla.",
      "Cuando una criatura te daña, puedes usar tu reacción para volverte invisible para ella hasta el final de tu próximo turno o hasta que la ataques.",
      "Al inicio de tu turno, puedes elegir a una criatura a 30 pies. Esa criatura no puede realizar reacciones hasta el inicio de tu próximo turno."
    ] 
  },
  "Adaptación": { 
    affinity: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
    affText: [
      "Ganas un +1 a las tiradas de salvación de Constitución.",
      "Puedes aguantar la respiración el doble de tiempo.",
      "Ganas una velocidad de nado igual a tu velocidad de movimiento.",
      "Ganas resistencia al daño por veneno.",
      "Una vez por descanso corto, puedes usar una acción para ganar 1d8 + tu nivel en puntos de vida temporales.",
      "Ganas una velocidad de escalada igual a tu velocidad de movimiento.",
      "Eres inmune a la condición de envenenado.",
      "El dado de puntos de vida temporales de la afinidad de 6 esencias aumenta a 1d20.",
      "No necesitas comer ni beber para sobrevivir.",
      "Cuando recibes daño, puedes usar tu reacción para ganar resistencia a ese tipo de daño hasta el inicio de tu próximo turno. Puedes usar esta habilidad una vez por descanso corto.",
      "Tu puntuación de Constitución aumenta en 2."
    ], 
    domain: [4, 8, 12], 
    domText: [
      "Puedes lanzar el conjuro Agrandar/Reducir sobre ti mismo a voluntad, sin gastar componentes materiales.",
      "Te aclimatas a cualquier entorno después de pasar una hora en él, volviéndote inmune a los efectos del frío o calor extremos.",
      "Al final de un descanso largo, puedes elegir un tipo de daño (fuego, frío, ácido, etc.). Ganas inmunidad a ese tipo de daño hasta tu próximo descanso largo."
    ] 
  },
  "Corrupción": { 
    affinity: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
    affText: [
      "Obtienes visión en la oscuridad hasta 60 pies. Si ya la tienes, el rango aumenta en 30 pies.",
      "Tienes ventaja en las tiradas de salvación contra enfermedades.",
      "Ganas resistencia al daño necrótico.",
      "Cualquier criatura hostil que comience su turno a 5 pies de ti recibe 1 punto de daño necrótico.",
      "Una vez por turno, cuando infliges daño necrótico a una criatura, no puede recuperar puntos de vida hasta el inicio de tu próximo turno.",
      "Eres inmune a que tu máximo de puntos de vida sea reducido.",
      "El daño de la afinidad de 5 esencias aumenta a una cantidad igual a tu bono de competencia.",
      "Obtienes ventaja en las tiradas de salvación contra la condición de asustado (frightened).",
      "Eres inmune al daño necrótico.",
      "Cuando una criatura muere a 30 pies de ti, ganas puntos de vida temporales iguales a tu nivel.",
      "Tu puntuación de Constitución o Sabiduría (tu elección al obtener este bono) aumenta en 2."
    ], 
    domain: [4, 8, 12], 
    domText: [
      "Una vez por descanso corto, cuando una criatura te daña, puedes usar tu reacción para infligirle 1d10 de daño necrótico y reducir su velocidad en 10 pies hasta el final de su próximo turno.",
      "Cuando infliges daño necrótico con una esencia, ignoras la resistencia a ese tipo de daño.",
      "Emites un aura de corrupción en un radio de 30 pies. Las criaturas hostiles que comiencen su turno dentro del aura no pueden recuperar puntos de vida y tienen desventaja en todas sus tiradas de salvación."
    ] 
  },
  "Protección": { 
    affinity: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
    affText: [
      "Ganas un +1 a todas las tiradas de salvación.",
      "Aumenta en 5 pies el alcance de tus esencias de curación o que otorgan puntos de vida temporales.",
      "Ganas resistencia al daño radiante.",
      "Cuando curas a un aliado, este también gana un +1 a su CA hasta el inicio de su próximo turno.",
      "Una vez por descanso corto, cuando una criatura a 30 pies de ti recibe daño, puedes usar tu reacción para reducir ese daño en 1d10.",
      "Eres inmune a las enfermedades.",
      "El dado de reducción de daño de la afinidad de 6 esencias aumenta a 1d20.",
      "Los golpes críticos contra ti se convierten en golpes normales.",
      "Eres inmune al daño radiante.",
      "Cuando un aliado a 30 pies de ti cae a 0 puntos de vida, puedes usar tu reacción para que en su lugar caiga a 1 punto de vida. Puedes usar esta habilidad una vez por descanso largo.",
      "Tu puntuación de Sabiduría o Carisma (tu elección al obtener este bono) aumenta en 2."
    ], 
    domain: [4, 8, 12], 
    domText: [
      "Una vez por descanso largo, puedes lanzar el conjuro Vínculo Protector sin gastar un espacio de conjuro.",
      "Cuando tú o un aliado a 30 pies de ti falláis una tirada de salvación, podéis usar vuestra reacción para tirar un d8 y añadirlo al total, potencialmente cambiando el resultado.",
      "Emites un aura de protección en un radio de 30 pies. Tú y tus aliados dentro del aura sois inmunes a la condición de asustado (frightened) y tenéis resistencia a todo el daño de conjuros."
    ] 
  },
  "Creación": { 
    affinity: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
    affText: [
      "Puedes hablar con los animales.",
      "Tienes ventaja en las tiradas de salvación contra veneno.",
      "Ganas resistencia al daño por ácido.",
      "Tus criaturas invocadas y compañeros animales ganan un bono a sus puntos de vida máximos igual al doble de tu nivel.",
      "Una vez por turno, cuando tú o una criatura aliada a 30 pies de ti haga una tirada de ataque, puedes tirar un d4 y añadirlo al resultado.",
      "Ignoras el terreno difícil creado por plantas (malezas, enredaderas, etc.).",
      "El dado de la afinidad de 6 esencias aumenta a 1d6.",
      "Tus criaturas invocadas tienen un +1 a sus tiradas de ataque y daño.",
      "Eres inmune a la condición de envenenado.",
      "Cuando invocas a una criatura, esta aparece con puntos de vida temporales iguales al doble de tu nivel.",
      "Tu puntuación de Sabiduría o Destreza (tu elección al obtener este bono) aumenta en 2."
    ], 
    domain: [4, 8, 12], 
    domText: [
      "Una vez por descanso largo, puedes lanzar el conjuro Convocar Animales como si usaras un espacio de conjuro de nivel 3.",
      "Tus criaturas invocadas ganan resistencia a todo el daño contundente, perforante y cortante de ataques no mágicos.",
      "Al inicio de tu turno, puedes elegir a una criatura aliada a 60 pies (incluyéndote a ti o a una invocación). Esa criatura recupera 2d8 puntos de vida y puede moverse hasta la mitad de su velocidad como una acción gratuita."
    ] 
  },
  "Destino": { 
    affinity: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 
    affText: [
      "Puedes usar tu modificador de atributo de esencia en lugar de Destreza para la iniciativa.",
      "Ganas un uso adicional de la habilidad Inspiración del DM.",
      "Ganas resistencia al daño de fuerza (force).",
      "Al final de un descanso largo, tira un d20 y anota el resultado. Una vez durante el día, puedes reemplazar cualquier tirada de ataque, salvación o habilidad tuya por ese resultado.",
      "Una vez por turno, cuando tú o un aliado a 30 pies falle una tirada de ataque, puedes añadir un +2 al resultado, potencialmente convirtiéndolo en un éxito.",
      "Eres inmune a los efectos que te impongan desventaja en las tiradas.",
      "El bono de la afinidad de 6 esencias aumenta a +4.",
      "El d20 que tiras para la afinidad de 5 esencias, ahora lo tiras con ventaja.",
      "Eres inmune al daño de fuerza (force).",
      "Cuando una criatura te obliga a hacer una tirada de salvación, puedes usar tu reacción para que en su lugar, sea ella quien deba superarla con la misma CD. Puedes usar esta habilidad una vez por descanso largo.",
      "Tu puntuación de Inteligencia o Sabiduría (tu elección al obtener este bono) aumenta en 2."
    ], 
    domain: [4, 8, 12], 
    domText: [
      "Una vez por descanso corto, puedes volver a lanzar cualquier dado que hayas tirado y quedarte con el nuevo resultado.",
      "Cuando un enemigo obtiene un golpe crítico contra ti o un aliado a 30 pies, puedes usar tu reacción para convertir ese crítico en un golpe normal.",
      "Al inicio de cada uno de tus turnos, ganas una acción bonus adicional que solo puedes usar para activar una esencia."
    ] 
  },
  "Vínculo": { 
    affinity: [], 
    affText: [], 
    domain: [], 
    domText: [] 
  }
};
/* Afinidad/Dominio demo (sustituye por reglas del manual cuando quieras) 
const RULES = {
  "Furia":      { affinity:[2,3], affText:["+5 pies a tu velocidad de movimiento","Obtienes ventaja en las tiradas para evitar ser derribado"], domain:[4,8,12], domText:["Dom 4 (+2 daño)","Dom 8 (+4 daño)","Dom 12 (+6 daño)"] },
  "Control":    { affinity:[2,3], affText:["+1 control","+2 control","+3 control"], domain:[4,8,12], domText:["Dom I","Dom II","Dom III"] },
  "Adaptación": { affinity:[2,3], affText:["+1 versatilidad","+2 versatilidad","+3 versatilidad"], domain:[4,8,12], domText:["Dom I","Dom II","Dom III"] },
  "Corrupción": { affinity:[2,3], affText:["+1 corrupción","+2 corrupción","+3 corrupción"], domain:[4,8,12], domText:["Dom I","Dom II","Dom III"] },
  "Protección": { affinity:[2,3], affText:["+1 defensa","+2 defensa","+3 defensa"], domain:[4,8,12], domText:["Dom I","Dom II","Dom III"] },
  "Creación":   { affinity:[2,3], affText:["+1 curación","+2 curación","+3 curación"], domain:[4,8,12], domText:["Dom I","Dom II","Dom III"] },
  "Destino":    { affinity:[2,3], affText:["+1 suerte","+2 suerte","+3 suerte"], domain:[4,8,12], domText:["Dom I","Dom II","Dom III"] },
  "Vínculo":    { affinity:[], affText:[], domain:[], domText:[] }
};
*/
/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const colorOf = n => (CONSTELACIONES.find(c=>c.name===n)||{}).color || "#999";
function parseReqNames(req){ if (!req) return []; return req.split(",").map(t=>t.trim()).filter(Boolean); }

/* SVG iconos por constelación */
function iconFor(constelacion) {
  const base = (path, stroke="#2b2b2b") =>
    `<svg class="constelacionIcon" viewBox="0 0 24 24" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="${path}" stroke="${stroke}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  switch (constelacion) {
    case "Furia": return base("M4 12h6l2-3 2 6 2-3h4", "#7a2018");
    case "Control": return base("M5 7h14M5 12h10M5 17h6", "#1f5f8f");
    case "Adaptación": return base("M6 18c6-2 6-10 12-12-4 6-2 12-12 12Z", "#6f4626");
    case "Corrupción": return base("M6 6l12 12M18 6l-12 12", "#1f2b30");
    case "Protección": return base("M12 3l7 4v5c0 5-4 7-7 9-3-2-7-4-7-9V7l7-4Z", "#8a6a0f");
    case "Creación": return base("M12 2v6M12 16v6M4 12h6M14 12h6", "#1f7a46");
    case "Destino": return base("M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm0 4v6l4 2", "#5e0b1d");
    case "Vínculo": return base("M7 12a5 5 0 0 1 10 0c0 4-5 7-5 7s-5-3-5-7Z", "#6d2aa0");
    default: return base("M4 12h16", "#444");
  }
}

/* Acordeón helpers */
function expandSection(headerEl, contentEl) {
  headerEl.classList.remove('is-collapsed');
  contentEl.style.maxHeight = contentEl.scrollHeight + 'px';
}
function collapseSection(headerEl, contentEl) {
  headerEl.classList.add('is-collapsed');
  contentEl.style.maxHeight = '0px';
}

/* ---------- Esencias DEMO: 2 por Tier (puedes ampliar luego) ---------- */
// (Para no repetir, mantengo un set resumido; tú reemplazas/añades del manual)
const FURIA_T1 = [
  { name:"Ariete Imparable", slot:1, type:"Pasiva", req:null, desc:"Ventaja al romper objetos; doble daño a objetos.", longDesc:"Ganas ventaja en las tiradas de Fuerza hechas para romper objetos. Tus ataques cuerpo a cuerpo infligen el doble de daño a objetos y estructuras.", max:1 },
  { name:"Corazón de la Batalla", slot:1, type:"Pasiva", req:null, desc:"Bajo la mitad de HP, +3 daño c/c.", longDesc:"Cuando estás por debajo de la mitad de tus puntos de vida totales, tus ataques cuerpo a cuerpo obtienen un +3 a las tiradas de daño.", max:1 },
  { name:"Furia Creciente", slot:1, type:"Activa", req:null, desc:"Acción Bonus (1 HS): Tu próximo ataque tiene ventaja y daño extra.", longDesc:"Costo: 1 HS. Tiempo: 1 Acción Bonus. Tu siguiente ataque con arma este turno se realiza con ventaja. Si impacta, causa 1d6 de daño adicional del mismo tipo que el arma.", max:1 },
  { name:"Grito de Guerra", slot:1, type:"Activa", req:null, desc:"Acción Bonus (1 HS): Grita para dar desventaja a los enemigos cercanos.", longDesc:"Costo: 1 HS. Tiempo: 1 Acción Bonus. Emites un grito intimidador. Todas las criaturas hostiles a 15 pies de ti que puedan oírte deben hacer una salvación de Sabiduría (CD de Esencia) o tener desventaja en su próxima tirada de ataque.", max:1 },
  { name:"Instinto de Supervivencia", slot:1, type:"Pasiva", req:null, desc:"+1 a las tiradas de salvación de Muerte.", longDesc:"Ganas un +1 a las tiradas de salvación de Muerte. Este bono no se acumula con otras esencias que mejoren directamente esta tirada.", max:1 },
  { name:"Mirada Desafiante", slot:1, type:"Activa", req:null, desc:"Reacción: Impón desventaja a un enemigo que ataque a un aliado.", longDesc:"Tiempo: 1 Reacción. Cuando una criatura a 30 pies de ti ataca a uno de tus aliados, puedes usar tu reacción para imponerle desventaja en esa tirada de ataque. Debes poder ver tanto al atacante como a tu aliado.", max:1 },
  { name:"Músculos de Acero", slot:1, type:"Pasiva", req:null, desc:"Aumenta tu capacidad de carga.", longDesc:"Tu capacidad de carga se considera como si tu puntuación de Fuerza fuera 4 puntos más alta.", max:1 },
  { name:"Piel Gruesa", slot:1, type:"Pasiva", req:null, desc:"+1 a la CA sin armadura pesada.", longDesc:"Ganas un +1 a tu Clase de Armadura cuando no llevas armadura pesada.", max:1 },
  { name:"Precisión Brutal", slot:1, type:"Pasiva", req:null, desc:"Tus golpes críticos cuerpo a cuerpo hacen más daño.", longDesc:"Cuando obtienes un golpe crítico con un ataque de arma cuerpo a cuerpo, puedes tirar un dado de daño de arma adicional y añadirlo al daño extra del crítico.", max:1 },
  { name:"Reflejos de Combate", slot:1, type:"Pasiva", req:null, desc:"Usa Fuerza en lugar de Destreza para la iniciativa.", longDesc:"Puedes usar tu modificador de Fuerza en lugar de tu modificador de Destreza al realizar tiradas de iniciativa.", max:1 },
  { name:"Represalia Súbita", slot:1, type:"Activa", req:null, desc:"Reacción: Ataca a un enemigo que te falle un ataque cuerpo a cuerpo.", longDesc:"Tiempo: 1 Reacción. Si un enemigo a 5 pies de ti te falla con un ataque cuerpo a cuerpo, puedes usar tu reacción para hacerle un ataque de oportunidad.", max:1 },
  { name:"Rompefilas", slot:1, type:"Pasiva", req:null, desc:"Empuja a los enemigos 5 pies al cargar.", longDesc:"Una vez por turno, si te mueves al menos 10 pies en línea recta hacia un enemigo antes de atacarlo, el primer ataque cuerpo a cuerpo que impacte ese turno empuja al objetivo 5 pies hacia atrás.", max:1 },
  { name:"Sangre Hirviente", slot:1, type:"Pasiva", req:null, desc:"Ganas resistencia al daño por fuego.", longDesc:"Ganas resistencia al daño por fuego.", max:1 },
  { name:"Velocidad de Light", slot:1, type:"Pasiva", req:null, desc:"Aumenta tu velocidad en 10 pies.", longDesc:"Tu velocidad base de movimiento aumenta en 10 pies.", max:1 }
];
const FURIA_T2 = [
  { name:"Aura de Terror", slot:2, type:"Pasiva", req:"Grito de Guerra", desc:"Hostiles a 10 pies −1 a ataques.", longDesc:"Criaturas hostiles que comiencen su turno a 10 pies de ti tienen −1 a sus tiradas de ataque.", max:1 },
  { name:"Bestia Imparable", slot:3, type:"Pasiva", req:"Rompefilas, Músculos de Acero", desc:"Inmune a terreno difícil; empuja 10 pies.", longDesc:"Eres inmune al terreno difícil. Rompefilas ahora empuja 10 pies.", max:1 },
  { name:"Chancho Keops I", slot:3, type:"Pasiva", req:"Piel Gruesa", desc:"Aumenta tus puntos de vida máximos.", longDesc:"Tu vitalidad y masa aumentan considerablemente. Ganas un bono a tus puntos de vida máximos igual al doble de tu nivel.", max:1 },
  { name:"Golpe Sísmico", slot:2, type:"Activa", req:"Ariete Imparable", desc:"Acción (2 HS): Golpea el suelo para derribar enemigos.", longDesc:"Costo: 2 HS. Tiempo: 1 Acción. Golpeas el suelo con una fuerza tremenda. Todas las criaturas en un radio de 10 pies deben hacer una salvación de Destreza (CD de Esencia) o ser derribadas.", max:1 },
  { name:"Ímpetu Violento", slot:2, type:"Pasiva", req:"Furia Creciente", desc:"Al matar, te mueves sin provocar A. de Oportunidad.", longDesc:"Una vez por turno, al reducir a una criatura a 0 HP con un ataque c/c, puedes moverte la mitad de tu velocidad sin provocar ataques de oportunidad.", max:1 },
  { name:"Piel de Magma", slot:2, type:"Pasiva", req:"Sangre Hirviente", desc:"Inmune al fuego; dañas a quienes te golpean.", longDesc:"Eres inmune al daño por fuego. Además, cualquier criatura que te golpee c/c desde 5 pies o menos, recibe 1d4 de daño de fuego.", max:1 },
  { name:"Presencia del Duelista", slot:2, type:"Activa", req:"Mirada Desafiante", desc:"Acción Bonus (1 HS): Obliga a un enemigo a atacarte.", longDesc:"Costo: 1 HS. Tiempo: 1 Acción Bonus. Eliges a una criatura. Durante 1 min, tiene desventaja en ataques contra cualquiera que no seas tú. El efecto termina si atacas a una criatura diferente.", max:1 },
  { name:"Voluntad Inquebrantable", slot:2, type:"Pasiva", req:"Corazón de la Batalla", desc:"Ventaja en salvaciones contra miedo y encanto.", longDesc:"Ganas ventaja en las tiradas de salvación contra las condiciones de asustado (frightened) y hechizado (charmed).", max:1 }
];
const FURIA_T3 = [
  { name:"Avatar de la Destrucción", slot:4, type:"Activa", req:"Golpe Sísmico, Ímpetu Violento", desc:"1 min: +1 dado, inmune paralizado/aturdido, ataque gratis.", longDesc:"Costo: 4 HS. Tiempo: 1 Acción. Durante 1 minuto, tus ataques c/c infligen un dado de daño de arma adicional, eres inmune a paralizado y aturdido y puedes hacer un ataque c/c como acción gratuita al final de tu turno.", max:1 },
  { name:"Chancho Keops II", slot:5, type:"Pasiva", req:"Chancho Keops I, Voluntad Inquebrantable", desc:"Doble HP y peso; resistencia daño físico no mágico.", longDesc:"Tu HP y peso se doblan. Ganas resistencia al daño contundente, perforante y cortante no mágico.", max:1 },
  { name:"Heraldo de la Guerra", slot:4, type:"Pasiva", req:"Aura de Terror, Presencia del Duelista", desc:"Aura que protege del miedo y da HP temporales.", longDesc:"Tú y aliados a 30 pies no pueden ser asustados y ganan HP temporales igual a tu nivel al inicio del combate. El radio de Aura de Terror aumenta a 30 pies.", max:1 },
  { name:"Furia Inextinguible", slot:3, type:"Pasiva", req:"Piel de Magma", desc:"Al caer a 0 HP, puedes salvar para quedarte con 1 HP.", longDesc:"Si caes a 0 o menos HP, puedes hacer una salvación de Constitución CD 10 para caer a 1 HP. La CD aumenta en 5 cada vez hasta un descanso largo.", max:1 },
  { name:"Tormenta de Acero", slot:3, type:"Activa", req:"Bestia Imparable", desc:"Acción (3 HS): Atacas a todos los enemigos a tu alcance.", longDesc:"Realizas un único ataque cuerpo a cuerpo contra cada enemigo de tu elección que esté a tu alcance. Debes hacer una tirada de ataque por separado para cada objetivo.", max:1 }
];
const CONTROL_T1 = [
  { name:"Cierre Diplomático", slot:1, type:"Activa", req:null, desc:"Calma a un enemigo hostil por 1 minuto.", longDesc:"Tiempo de lanzamiento: 1 Acción. Puedes usar tus habilidades de diplomacia para calmar una situación tensa. Una criatura hostil a 30 pies debe hacer una tirada de salvación de Sabiduría (CD de Esencia). Si falla, cesa su hostilidad y se vuelve indiferente durante 1 minuto, siempre y cuando no se le ataque o se actúe en su contra.", max:1 },
  { name:"Engaño Sutil", slot:1, type:"Pasiva", req:null, desc:"Gana competencia (o pericia) en Engañar.", longDesc:"Obtienes competencia en la habilidad de Engañar. Si ya eres competente, puedes añadir el doble de tu bono de competencia a las tiradas.", max:1 },
  { name:"Escudo Psíquico", slot:1, type:"Pasiva", req:null, desc:"Bloquea lecturas de aura/emociones; ventaja contra lectura de mente.", longDesc:"De forma permanente, bloqueas la lectura de tu aura o emociones por medios mágicos. Además, obtienes ventaja en las tiradas de salvación contra efectos que intenten leer tus pensamientos.", max:1 },
  { name:"Fijación Mental", slot:1, type:"Activa", req:null, desc:"Acción Bonus (1 HS): Da desventaja en la próxima salvación de un enemigo.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Eliges a una criatura a 60 pies. La próxima tirada de salvación que esa criatura realice antes del final de tu próximo turno, se hace con desventaja.", max:1 },
  { name:"Ilusión Menor", slot:1, type:"Activa", req:null, desc:"Acción: Crea una pequeña imagen o sonido ilusorio.", longDesc:"Tiempo de lanzamiento: 1 Acción. Creas una imagen o sonido ilusorio menor (como una pequeña distracción, un susurro o un objeto inmóvil) que dura 1 minuto. La ilusión no puede causar daño ni interactuar físicamente. Requiere una tirada de Investigación (CD de Esencia) para ser detectada como falsa.", max:1 },
  { name:"Manto de Misterio", slot:1, type:"Pasiva", req:null, desc:"La magia de adivinación tiene desventaja para localizarte.", longDesc:"Eres difícil de rastrear por medios mágicos. Cualquier tirada hecha para localizarte usando magia de adivinación se realiza con desventaja.", max:1 },
  { name:"Memorizar Rostro", slot:1, type:"Pasiva", req:null, desc:"Memoriza rostros permanentemente; +2 a Perspicacia.", longDesc:"Al observar a una persona, puedes memorizar su rostro y rasgos físicos de manera detallada e indefinida. Podrás reconocerla instantáneamente en el futuro, incluso si usa un disfraz común. Adicionalmente, obtienes un +2 a las tiradas de Perspicacia (Insight).", max:1 },
  { name:"Mente Analítica", slot:1, type:"Pasiva", req:null, desc:"Gana competencia (o pericia) en Investigación.", longDesc:"Obtienes competencia en la habilidad de Investigación. Si ya eres competente, puedes añadir el doble de tu bono de competencia a las tiradas.", max:1 },
  { name:"Paso Silencioso", slot:1, type:"Pasiva", req:null, desc:"Ventaja en Sigilo al moverte sin hacer ruido.", longDesc:"Ganas ventaja en las tiradas de Destreza (Sigilo) cuando intentas moverte sin hacer ruido.", max:1 },
  { name:"Perspicacia Aguda", slot:1, type:"Pasiva", req:null, desc:"Ventaja para determinar si alguien miente.", longDesc:"Tienes ventaja en las tiradas de Perspicacia (Insight) para determinar si una criatura está mintiendo.", max:1 },
  { name:"Señal Telepática", slot:1, type:"Activa", req:null, desc:"Acción Bonus: Envía una palabra o imagen a la mente de alguien.", longDesc:"Tiempo de lanzamiento: 1 Acción Bonus. Envías una palabra o una imagen simple a la mente de una criatura a 120 pies. No puedes recibir una respuesta.", max:1 },
  { name:"Telepatía I", slot:1, type:"Pasiva", req:null, desc:"Habla mental (30 pies) y +1 a salvaciones de Sabiduría.", longDesc:"Ganas habla mental, permitiéndote comunicarte telepáticamente con cualquier criatura que puedas ver a 30 pies de ti (si la criatura tiene un idioma). Además, obtienes un +1 a las salvaciones de Sabiduría.", max:1 },
  { name:"Velo de Sombras", slot:1, type:"Activa", req:null, desc:"Acción Bonus (1 HS): Invisible hasta el final de tu turno.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Te vuelves invisible hasta el final de tu turno. La invisibilidad termina antes si atacas o lanzas un conjuro.", max:1 },
  { name:"Voz Cautivadora", slot:1, type:"Pasiva", req:null, desc:"Gana competencia (o pericia) en Persuasión.", longDesc:"Obtienes competencia en la habilidad de Persuasión. Si ya eres competente, puedes añadir el doble de tu bono de competencia a las tiradas.", max:1 }
];
const CONTROL_T2 = [
  { name:"El Buen Burdel", slot:2, type:"Pasiva", req:"Voz Cautivadora", desc:"Ventaja en Persuasión; habla cualquier idioma por 1 escena.", longDesc:"Tu voz se vuelve extremadamente convincente. Ganas ventaja en todas las tiradas de Persuasión. Adicionalmente, gastando 1 HS como acción, puedes comunicarte en cualquier idioma con alguna criatura cercana. Esto no te da conocimiento del idioma, pero te permite hablarlo, leerlo y entenderlo perfectamente durante la escena.", max:1 },
  { name:"Espejismo Fugaz", slot:2, type:"Activa", req:"Ilusión Menor", desc:"Reacción (2 HS): Al ser golpeado, reduce el daño a la mitad y te teletransportas 5 pies.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Reacción. Cuando eres golpeado por un ataque, puedes usar tu reacción para crear una ilusión de ti mismo que recibe el golpe, mientras te teletransportas 5 pies a un espacio desocupado que puedas ver. El daño del ataque se reduce a la mitad.", max:1 },
  { name:"Invisibilidad Superior", slot:3, type:"Activa", req:"Velo de Sombras", desc:"Acción (3 HS): Invisible por 1 minuto.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción. Te vuelves invisible durante 1 minuto. La invisibilidad termina antes si atacas o lanzas un conjuro.", max:1 },
  { name:"Lectura de Mente", slot:2, type:"Activa", req:"Escudo Psíquico", desc:"Acción (1 HS): Lee los pensamientos superficiales de una criatura.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Intentas leer los pensamientos superficiales de una criatura a 30 pies. La criatura debe hacer una tirada de salvación de Sabiduría (CD de Esencia). Si falla, puedes leer sus pensamientos actuales durante 1 minuto. La criatura sabe que estás intentando leer su mente.", max:1 },
  { name:"Memoria Compartida", slot:2, type:"Activa", req:"Memorizar Rostro", desc:"1 Minuto: Comparte una memoria exacta con un voluntario.", longDesc:"Tiempo de lanzamiento: 1 Minuto. Puedes compartir una memoria específica con otra criatura voluntaria al tocarla. La memoria se transmite en un instante y es experimentada por la otra criatura tal como la viviste, con todos los detalles y emociones asociados.", max:1 },
  { name:"Sombra Elusiva", slot:2, type:"Activa", req:"Paso Silencioso", desc:"Acción Bonus: Te vuelves casi invisible en la oscuridad.", longDesc:"Tiempo de lanzamiento: 1 Acción Bonus. Puedes fundirte con las sombras en ambientes de penumbra u oscuridad. Mientras estés en la oscuridad, te vuelves casi invisible. La invisibilidad dura mientras permanezcas en la oscuridad y te muevas a no más de la mitad de tu velocidad en tu turno.", max:1 },
  { name:"Sugestión Sutil", slot:2, type:"Activa", req:"Cierre Diplomático", desc:"Acción (2 HS): Sugiere un curso de acción a una criatura.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Sugieres un curso de acción (limitado a una o dos frases) a una criatura a 30 pies. Si la criatura puede oírte y entenderte, debe hacer una tirada de salvación de Sabiduría (CD de Esencia). Si falla, sigue el curso de acción sugerido lo mejor que puede, siempre que la sugerencia no sea obviamente autodestructiva.", max:1 },
  { name:"Telepatía II", slot:2, type:"Pasiva", req:"Telepatía I", desc:"Conversaciones telepáticas en el mismo plano; mejora Telepatía I.", longDesc:"Tu alcance telepático se expande enormemente. Puedes mantener conversaciones telepáticas (requiere concentración) con criaturas que conozcas mientras se encuentren en el mismo plano de existencia.\n\n*Nota de Sinergia: Esta esencia mejora y reemplaza los beneficios de Telepatía I. Mientras tengas equipada Telepatía II, también obtienes todos los beneficios de Telepatía I sin necesidad de tenerla equipada.*", max:1 }
];
const CONTROL_T3 = [
  { name:"Amo de Marionetas", slot:5, type:"Activa", req:"Sugestión Sutil, Lectura de Mente", desc:"Acción (5 HS): Controla a un humanoide por 1 minuto.", longDesc:"Costo de uso: 5 HS. Tiempo de lanzamiento: 1 Acción. Intentas tomar control total de una criatura humanoide a 60 pies. El objetivo debe hacer una tirada de salvación de Sabiduría (CD de Esencia). Si falla, controlas sus acciones durante 1 minuto (requiere concentración). El objetivo puede repetir la tirada de salvación al final de cada uno de sus turnos, terminando el efecto si tiene éxito.", max:1 },
  { name:"Caminante del Crepúsculo", slot:4, type:"Pasiva", req:"Invisibilidad Superior, Sombra Elusiva", desc:"Invisibilidad Superior a voluntad; atacar no la rompe.", longDesc:"Has dominado el arte de no ser visto. Puedes lanzar Invisibilidad Superior sobre ti mismo a voluntad sin gastar HS. Además, atacar o lanzar un conjuro no rompe la invisibilidad, aunque revela tu posición momentáneamente hasta que te mueves.", max:1 },
  { name:"Doble Ilusorio", slot:3, type:"Activa", req:"Espejismo Fugaz", desc:"Acción Bonus (3 HS): Crea un doble perfecto por 1 minuto.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción Bonus. Creas una copia ilusoria perfecta de ti mismo que dura 1 minuto. El doble tiene tu misma CA y estadísticas, pero 1 punto de vida. Puedes usar tu acción bonus para moverlo y hacer que actúe. El doble puede hablar y parece real, pero no puede atacar. Puedes usar tus esencias como si estuvieras en la posición de tu doble.", max:1 },
  { name:"Santuario Mental", slot:3, type:"Pasiva", req:"El Buen Burdel", desc:"Aura de 30 pies que protege del miedo, encanto y lectura de mente.", longDesc:"Tu mente y la de tus aliados cercanos están protegidas. Tú y todos los aliados a 30 pies de ti son inmunes a la lectura de pensamientos y tienen ventaja en las tiradas de salvación contra las condiciones de asustado (frightened) y hechizado (charmed).", max:1 },
  { name:"Telepatía III", slot:4, type:"Pasiva", req:"Telepatía II", desc:"Conversaciones telepáticas interplanares; mejora Telepatía I y II.", longDesc:"Tu poder mental trasciende las barreras de la realidad. Puedes mantener conversaciones telepáticas con criaturas que conozcas incluso si están en diferentes planos de existencia. Además, puedes intentar contactar a criaturas que no conoces si tienes una descripción clara de ellas o un objeto que les pertenezca (requiere una tirada a discreción del DM).\n\n*Nota de Sinergia: Esta esencia mejora y reemplaza los beneficios de Telepatía II. Mientras tengas equipada Telepatía III, también obtienes todos los beneficios de Telepatía I y II sin necesidad de tenerlas equipadas.*", max:1 }
];const ADAPT_T1 = [
  { name:"Adaptación Acuática", slot:1, type:"Pasiva", req:null, desc:"Respiras bajo el agua; ventaja al nadar.", longDesc:"Puedes respirar bajo el agua y ganas ventaja en las tiradas de Atletismo para nadar.", max:1 },
  { name:"Armadura Natural", slot:1, type:"Pasiva", req:null, desc:"Sin armadura: CA 13 + DEX.", longDesc:"Tu piel se endurece. Cuando no llevas armadura, tu Clase de Armadura base es 13 + tu modificador de Destreza.", max:1 },
  { name:"Brazos Prensiles", slot:1, type:"Activa", req:null, desc:"Acción Bonus (1HS): Gana 5 pies de alcance c/c por 1 min.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Durante 1 minuto, tus brazos pueden alargarse, aumentando tu alcance con ataques cuerpo a cuerpo en 5 pies.", max:1 },
  { name:"Garras Retráctiles", slot:1, type:"Pasiva", req:null, desc:"Ganas un ataque de garras (1d6 cortante).", longDesc:"Desarrollas garras que son armas naturales. Cuentan como armas cuerpo a cuerpo simples con las que eres competente y causan 1d6 de daño cortante. Puedes retraerlas o extenderlas como una acción gratuita.", max:1 },
  { name:"Hoop Clasico", slot:1, type:"Pasiva", req:null, desc:"Salta tu velocidad sin carrerilla ni tirada.", longDesc:"Ganas salto como movimiento natural, pudiendo así, saltar sin dificultad una distancia equilavente a tu velocidad sin necesidad de tomar vuelo o tirar atletismo.", max:1 },
  { name:"Levitar I", slot:1, type:"Activa", req:null, desc:"Levita a 1 pie de cualquier superficie.", longDesc:"Tiempo de lanzamiento: 1 Acción de Movimiento. Puedes levitar a 1 pie de distancia de cualquier superficie sólida y mantenerte así. Si te derriban, caes al suelo. Esta esencia no previene daño por caídas.", max:1 },
  { name:"Masa Maleable", slot:1, type:"Pasiva", req:null, desc:"Ventaja para escapar de agarres; reduce daño contundente.", longDesc:"Tu cuerpo posee una flexibilidad antinatural. Ganas ventaja en las tiradas para escapar de agarradas (grapples) y para pasar a través de espacios estrechos. Adicionalmente, una vez por descanso corto, puedes usar tu reacción al recibir daño contundente para reducir ese daño en una cantidad igual a tu bono de competencia.", max:1 },
  { name:"Metamorfosis Menor", slot:1, type:"Activa", req:null, desc:"Acción (1 HS): Altera tu apariencia de forma menor por 1 hora.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Puedes alterar tu apariencia física de forma menor durante 1 hora (cambiar el color de pelo, la forma de la nariz, añadir pecas, etc.). No es suficiente para hacerte pasar por otra persona, pero sí para un disfraz rápido.", max:1 },
  { name:"Pies Ligeros", slot:1, type:"Pasiva", req:null, desc:"Ignora el terreno difícil natural.", longDesc:"Puedes moverte a través de terreno difícil compuesto de materiales naturales (roca, maleza, nieve) sin gastar movimiento extra.", max:1 },
  { name:"Piel Camaleónica", slot:1, type:"Activa", req:null, desc:"Acción: Gana ventaja en Sigilo al quedarte quieto.", longDesc:"Tiempo de lanzamiento: 1 Acción. Puedes cambiar el color de tu piel y equipo para mimetizarte con tu entorno. Tienes ventaja en las tiradas de Destreza (Sigilo) hechas para esconderte, siempre que permanezcas quieto.", max:1 },
  { name:"Resistencia del Roble", slot:1, type:"Pasiva", req:null, desc:"Tu HP máximo aumenta en tu nivel.", longDesc:"Tu HP máximo aumenta en una cantidad igual a tu nivel.", max:1 },
  { name:"Salto Potenciado", slot:1, type:"Pasiva", req:null, desc:"Tu distancia de salto se triplica.", longDesc:"Tu distancia de salto se triplica.", max:1 },
  { name:"Sentidos Agudos", slot:1, type:"Pasiva", req:null, desc:"Ventaja en Percepción basada en el olfato.", longDesc:"Ganas ventaja en las tiradas de Percepción que dependan del olfato.", max:1 },
  { name:"Toque del Alquimista", slot:1, type:"Activa", req:null, desc:"Acción: Transforma un material no mágico en otro.", longDesc:"Tiempo de lanzamiento: 1 Acción. Tocas un objeto no mágico no más grande que un metro cúbico y lo transformas en otro material no mágico de valor igual o inferior (madera en piedra, cobre en tela, etc.). El efecto dura 1 hora.", max:1 }
];
const ADAPT_T2 = [
  { name:"Alas Rudimentarias", slot:2, type:"Pasiva", req:"Levitar I", desc:"Vuelo 30 pies; si te derriban, caes.", longDesc:"Desarrollas unas alas (de aspecto a tu elección: plumas, murciélago, insecto) que te otorgan una velocidad de vuelo de 30 pies. Si te derriban mientras vuelas, caes al suelo.", max:1 },
  { name:"Arma Corporal", slot:2, type:"Pasiva", req:"Garras Retráctiles", desc:"Arma natural elegida es mágica (1d8).", longDesc:"Elige una de tus armas naturales (como las otorgadas por Garras Retráctiles). Esa arma natural ahora se considera mágica a efectos de superar la resistencia e inmunidad a los ataques no mágicos. Además, su dado de daño aumenta a 1d8.", max:1 },
  { name:"Cuerpo Elástico", slot:2, type:"Pasiva", req:"Masa Maleable", desc:"+5 pies de alcance c/c; resistencia a daño por caída.", longDesc:"Tu capacidad para estirarte y deformarte es asombrosa. Tu alcance con ataques cuerpo a cuerpo aumenta permanentemente en 5 pies. Además, obtienes resistencia al daño por caída.", max:1 },
  { name:"Forma de Bestia Menor", slot:3, type:"Activa", req:"Metamorfosis Menor", desc:"Acción (2 HS): Transfórmate en una bestia (CR 1/2) por 1 hora.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Puedes transformarte en cualquier bestia de tamaño Pequeño o Mediano con un valor de desafío (CR) de 1/2 o inferior. Mantienes tus puntuaciones de Inteligencia, Sabiduría y Carisma. La transformación dura 1 hora.", max:1 },
  { name:"Levitar II", slot:2, type:"Pasiva", req:"Levitar I", desc:"Vuelo restringido; si te derriban, flotas.", longDesc:"Ganas velocidad de vuelo, con la restriccion de que siempre haya una distancia vertical no superior a la de tu velocidad de movimiento. Si te derriban, te mantienes en el aire.", max:1 },
  { name:"Piel de Piedra", slot:3, type:"Pasiva", req:"Armadura Natural", desc:"Resistencia al daño contundente no mágico.", longDesc:"Tu piel adquiere la dureza de la roca. Ganas resistencia al daño contundente de ataques no mágicos.", max:1 },
  { name:"Regeneración Lenta", slot:3, type:"Pasiva", req:"Resistencia del Roble", desc:"Recuperas HP igual a tu BC cada turno.", longDesc:"Al inicio de cada uno de tus turnos, si tienes al menos 1 punto de vida, recuperas una cantidad de puntos de vida igual a tu bono de competencia. Si recibes daño de fuego o ácido, esta habilidad no funciona hasta el final de tu próximo turno.", max:1 },
  { name:"Respirar en Cualquier Entorno", slot:2, type:"Pasiva", req:"Adaptación Acuática", desc:"Puedes respirar en cualquier ambiente.", longDesc:"Tu cuerpo se adapta a cualquier entorno respirable. Puedes respirar normalmente en cualquier ambiente, ya sea bajo el agua, a grandes alturas o incluso en atmósferas con poco oxígeno o gases tóxicos.", max:1 }
];
const ADAPT_T3 = [
  { name:"Cuerpo Perfecto", slot:4, type:"Pasiva", req:"Regeneración Lenta, Piel de Piedra", desc:"Elimina condiciones al inicio de turno; no envejece.", longDesc:"Tu dominio sobre tu propia biología es absoluto. Al inicio de tu turno, puedes elegir terminar una de las siguientes condiciones que te afecte: cegado, ensordecido, paralizado o envenenado. Además, dejas de envejecer y no puedes ser envejecido por medios mágicos.", max:1 },
  { name:"Forma de Quimera", slot:4, type:"Activa", req:"Forma de Bestia Menor, Arma Corporal", desc:"Acción (4 HS): 1 min. Forma híbrida (elige 3 beneficios).", longDesc:"Costo de uso: 4 HS. Tiempo de lanzamiento: 1 Acción. Durante 1 minuto, te transformas en una poderosa forma híbrida. Elige tres de los siguientes beneficios:\n- Alas (velocidad de vuelo de 40 pies).\n- Garras (tus ataques sin arma causan 2d8 de daño cortante).\n- Piel de Hierro (resistencia al daño contundente, perforante y cortante de ataques no mágicos).\n- Sentidos de Depredador (ventaja en tiradas de Percepción y eres inmune a ser sorprendido).\n- Cola con Aguijón (puedes hacer un ataque con aguijón como acción bonus que causa 1d10 de daño perforante y obliga a una salvación de Constitución contra veneno).", max:1 },
  { name:"Maestro de la Materia", slot:3, type:"Activa", req:"Toque del Alquimista", desc:"Acción (5 HS): Reconfigura 10m cúbicos de materia.", longDesc:"Costo de uso: 5 HS. Tiempo de lanzamiento: 1 Acción. Puedes reconfigurar la materia no mágica a tu alrededor. Elige un área de 10 metros cúbicos. Puedes convertir ese material en otro de igual valor (tierra en piedra, madera en hierro) de forma permanente, o puedes dar forma al terreno (crear una pared, un puente simple, o terreno difícil).", max:1 },
  { name:"Transformar Objeto", slot:4, type:"Pasiva", req:"Toque del Alquimista", desc:"Gana un slot de vínculo de objeto mágico adicional.", longDesc:"Puedes transformar un objeto mágico a elección para que aparente ser mundano. Este será percibido como un objeto no mágico a ojos de los demás, pero mantendrá todas sus propiedades. En consecuencia, dicho objeto no requerirá ser vinculado (incluso si lo requeria antes). Un personaje no puede tener esta esencia equipada mas de una vez.", max:1 },
  { name:"Vuelo Verdadero", slot:3, type:"Pasiva", req:"Alas Rudimentarias, Levitar II", desc:"+30 pies de vuelo; vuelo sin restricciones.", longDesc:"Tu capacidad de vuelo es total y sin restricciones. Tu velocidad de vuelo aumenta en 30 pies y Puedes permanecer en el aire de forma indefinida, incluso si eres derribado.", max:1 }
];const CORR_T1 = [
  { name:"Armadura de Sombras", slot:1, type:"Activa", req:null, desc:"1 HS, +1 CA por 1 hora.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Te envuelves en sombras protectoras. Durante 1 hora, obtienes un +1 a tu Clase de Armadura.", max:1 },
  { name:"Atadura Sombría", slot:1, type:"Activa", req:null, desc:"1 HS, Bonus: −10 pies a velocidad (1 turno).", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Apuntas a la sombra de una criatura a 30 pies. La criatura debe hacer una tirada de salvación de Fuerza (CD de Esencia) o su velocidad se reduce en 10 pies hasta el final de su próximo turno.", max:1 },
  { name:"Cosecha Menor", slot:1, type:"Pasiva", req:null, desc:"Al reducir a 0 HP, recuperas vida igual a tu BC.", longDesc:"Cuando reduces a una criatura hostil a 0 puntos de vida, recuperas una cantidad de puntos de vida igual a tu bono de competencia.", max:1 },
  { name:"Debilidad Contagiosa", slot:1, type:"Activa", req:null, desc:"1 HS, Bonus: Próximo ataque de un enemigo causa mitad de daño.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Eliges una criatura a 30 pies. Su próximo ataque, si es antes del final de tu siguiente turno, causa la mitad de daño.", max:1 },
  { name:"Drenaje de Vigor", slot:1, type:"Pasiva", req:null, desc:"1/turno al golpear, -1 a próxima salv. FUE o CON.", longDesc:"Una vez por turno, cuando golpeas a una criatura con un ataque de arma, puedes hacer que sufra una penalización de -1 a su próxima tirada de salvación de Fuerza o Constitución (tu elección).", max:1 },
  { name:"Manos Pegajosas", slot:1, type:"Pasiva", req:null, desc:"Gana competencia (o pericia) en Juego de Manos.", longDesc:"Obtienes competencia en la habilidad de Juego de Manos. Si ya eres competente, puedes añadir el doble de tu bono de competencia a las tiradas.", max:1 },
  { name:"Mirada Inquietante", slot:1, type:"Activa", req:null, desc:"Bonus: Desventaja en ataques si no te atacan a ti.", longDesc:"Tiempo de lanzamiento: 1 Acción Bonus. Fijas tu mirada en una criatura a 30 pies. Debe hacer una tirada de salvación de Sabiduría (CD de Esencia) o tener desventaja en las tiradas de ataque contra objetivos que no seas tú hasta el inicio de tu próximo turno.", max:1 },
  { name:"Paso Espectral", slot:1, type:"Pasiva", req:null, desc:"Ventaja en Sigilo en penumbra u oscuridad.", longDesc:"Tienes ventaja en las tiradas de Sigilo cuando te encuentras en penumbra u oscuridad.", max:1 },
  { name:"Resistencia Necrótica", slot:1, type:"Pasiva", req:null, desc:"Ventaja en salvaciones contra daño necrótico.", longDesc:"Te aclimatas a las energías de la no-muerte. Ganas ventaja en las tiradas de salvación contra efectos que causen daño necrótico.", max:1 },
  { name:"Sentir la Muerte", slot:1, type:"Activa", req:null, desc:"Acción: Siente no-muertos o caídos a 60 pies.", longDesc:"Tiempo de lanzamiento: 1 Acción. Puedes sentir la presencia de no-muertos o de criaturas con 0 puntos de vida en un radio de 60 pies a tu alrededor durante 1 minuto. No conoces su ubicación exacta, solo su presencia y dirección general.", max:1 },
  { name:"Toque de Fatiga", slot:1, type:"Activa", req:null, desc:"1 HS, Acción: Impide reacciones del enemigo.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Realizas un ataque de toque cuerpo a cuerpo contra una criatura. Si impactas, la criatura no puede realizar reacciones hasta el final de su próximo turno.", max:1 },
  { name:"Toque Entrópico", slot:1, type:"Pasiva", req:null, desc:"Añade tu atributo de esencia al daño de cantrips necróticos.", longDesc:"Tus cantrips que infligen daño necrótico ahora añaden tu modificador de atributo de esencia al daño.", max:1 },
  { name:"Visión del Final", slot:1, type:"Pasiva", req:null, desc:"Ventaja en Insight para determinar debilidades.", longDesc:"Ganas ventaja en las tiradas de Insight para determinar las debilidades o vulnerabilidades de una criatura.", max:1 },
  { name:"Voz de ultratumba", slot:1, type:"Pasiva", req:null, desc:"Gana competencia (o pericia) en Intimidación.", longDesc:"Tu voz adquiere un tono resonante e inquietante. Ganas competencia en la habilidad de Intimidación. Si ya eres competente, puedes añadir el doble de tu bono de competencia a las tiradas.", max:1 }
];
const CORR_T2 = [
  { name:"Aura de Decadencia", slot:2, type:"Pasiva", req:"Drenaje de Vigor", desc:"Hostiles a 10 pies no pueden curarse.", longDesc:"Tu presencia exuda entropía. Las criaturas hostiles a 10 pies de ti no pueden recuperar puntos de vida.", max:1 },
  { name:"Caminar Sombrío", slot:2, type:"Activa", req:"Paso Espectral", desc:"2 HS, Bonus: teletransporte 30 pies en sombras.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción Bonus. Puedes teletransportarte hasta 30 pies a un espacio desocupado que puedas ver en penumbra u oscuridad.", max:1 },
  { name:"Maldición de la Desgracia", slot:3, type:"Activa", req:"Mirada Inquietante", desc:"3 HS, Acción: Un enemigo resta 1d4 a sus ataques y salvaciones.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción. Eliges a una criatura a 60 pies. Durante 1 minuto (requiere concentración), cada vez que esa criatura haga una tirada de ataque o una tirada de salvación, debe tirar un d4 y restar el resultado de su tirada.", max:1 },
  { name:"Marioneta de Carne", slot:3, type:"Activa", req:"Sentir la Muerte", desc:"2 HS, Acción: Anima un cadáver como un zombi por 1 hora.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Eliges el cadáver de un humanoide Mediano o Pequeño a 10 pies. Lo animas como un zombi bajo tu control durante 1 hora. El zombi actúa en tu turno. Puedes usar una acción bonus para darle un comando mental. [solo 1 zombie a la vez]", max:1 },
  { name:"Sifón de Alma", slot:2, type:"Pasiva", req:"Cosecha Menor", desc:"Al matar, un aliado gana HP temporales.", longDesc:"Cuando reduces a una criatura hostil a 0 puntos de vida, además de recuperar vida, puedes elegir a un aliado a 30 pies para que gane puntos de vida temporales iguales a tu nivel.", max:1 },
  { name:"Susurro de los Muertos", slot:2, type:"Activa", req:"Voz de ultratumba", desc:"1 HS, 5 min: Haz 3 preguntas a un cadáver.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 5 Minutos. Puedes comunicarte brevemente con un cadáver en el rango que haya fallecido en las últimas 24 horas. El espíritu responderá a 3 preguntas de manera concisa y con la verdad.", max:1 },
  { name:"Terror", slot:2, type:"Activa", req:"Mirada Inquietante", desc:"2 HS, Acción: Asusta a un enemigo por 1 minuto.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Proyectas una imagen de los peores miedos de una criatura. Elige un objetivo a 60 pies. Debe hacer una tirada de salvación de Sabiduría (CD de Esencia). Si falla, queda asustado (frightened) de ti durante 1 minuto.", max:1 },
  { name:"Toque Vampírico", slot:3, type:"Activa", req:"Drenaje de Vigor", desc:"1 HS, Acción: 3d6 daño necrótico y te curas la mitad.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Realizas un ataque de toque mágico cuerpo a cuerpo. Si impactas, la criatura recibe 3d6 de daño necrótico y tú recuperas la mitad de esa cantidad en puntos de vida.", max:1 }
];
const CORR_T3 = [
  { name:"Cosecha de Almas", slot:4, type:"Activa", req:"Sifón de Alma, Toque Vampírico", desc:"4 HS, cono 30 pies 8d6 necrótico (CON mitad); te curas.", longDesc:"Costo de uso: 4 HS. Tiempo de lanzamiento: 1 Acción. Desatas una ola de energía necrótica en un cono de 30 pies. Cada criatura en el área debe hacer una tirada de salvación de Constitución (CD de Esencia). Si fallan, reciben 8d6 de daño necrótico, o la mitad si tienen éxito. Recuperas puntos de vida iguales a la mitad del daño total infligido a un único objetivo (el que más daño haya recibido).", max:1 },
  { name:"Forma Espectral", slot:4, type:"Activa", req:"Caminar Sombrío", desc:"5 HS, 1 min: resistencia a todo; atraviesa objetos.", longDesc:"Costo de uso: 5 HS. Tiempo de lanzamiento: 1 Acción. Durante 1 minuto, te vuelves como un fantasma. Ganas resistencia a todo el daño y puedes moverte a través de otras criaturas y objetos como si fueran terreno difícil.", max:1 },
  { name:"Levantar Horda", slot:5, type:"Activa", req:"Marioneta de Carne", desc:"6 HS, 1 min: Anima hasta 5 zombis por 24 horas.", longDesc:"Costo de uso: 6 HS. Tiempo de lanzamiento: 1 Minuto. Puedes animar hasta 5 cadáveres de humanoides como zombis bajo tu control durante 24 horas. Una vez que usas esta habilidad, no puedes volver a usarla hasta que completes un descanso largo.", max:1 },
  { name:"Señor de las Maldiciones", slot:3, type:"Pasiva", req:"Maldición de la Desgracia, Aura de Decadencia", desc:"Enemigos afectados tienen desventaja en TDS de Muerte; Aura +30 pies.", longDesc:"Tu dominio sobre la entropía es absoluto. Los enemigos afectados por tus esencias de la constelación Negra tienen desventaja en sus tiradas de salvación de Muerte. Además, el radio de tu Aura de Decadencia aumenta a 30 pies.", max:1 },
  { name:"Palabra de Poder: Drenar", slot:5, type:"Activa", req:"Terror", desc:"7 HS, Acción: 10d10 daño necrótico y 1 agotamiento (CON mitad).", longDesc:"Costo de uso: 7 HS. Tiempo de lanzamiento: 1 Acción. Eliges una criatura que puedas ver a 60 pies y pronuncias una palabra de poder. La criatura debe hacer una tirada de salvación de Constitución (CD de Esencia). Si falla, sufre 10d10 de daño necrótico y un nivel de agotamiento. Si tiene éxito, sufre la mitad del daño y ningún nivel de agotamiento.", max:1 }
];
const PROT_T1 = [
  { name:"Aura de Confort", slot:1, type:"Pasiva", req:null, desc:"Aliados a 10 pies: ventaja vs asustado.", longDesc:"Tú y tus aliados a 10 pies de ti tenéis ventaja en las tiradas de salvación contra la condición de asustado (frightened).", max:1 },
  { name:"Baluarte Menor", slot:1, type:"Activa", req:null, desc:"1 HS, Reacción: +2 CA contra un ataque.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Reacción. Cuando eres golpeado por un ataque, puedes usar tu reacción para ganar un +2 a tu CA contra ese ataque, potencialmente haciendo que falle.", max:1 },
  { name:"Bendición del Sanador", slot:1, type:"Pasiva", req:null, desc:"Tus curaciones restauran HP extra igual a tu BC.", longDesc:"Cuando lanzas un conjuro o usas una esencia que restaura puntos de vida a una criatura, esta recupera puntos de vida adicionales iguales a tu bono de competencia.", max:1 },
  { name:"Coraza de Fe", slot:1, type:"Pasiva", req:null, desc:"+1 a la CA con armadura media o pesada.", longDesc:"Ganas un +1 a tu Clase de Armadura cuando llevas armadura media o pesada.", max:1 },
  { name:"Escudo de Represalia", slot:1, type:"Activa", req:null, desc:"Reacción: Impón desventaja a un atacante c/c.", longDesc:"Tiempo de lanzamiento: 1 Reacción. Cuando una criatura a 5 pies de ti te ataca, puedes usar tu reacción para imponerle desventaja en la tirada de ataque.", max:1 },
  { name:"Faro de Esperanza", slot:1, type:"Activa", req:null, desc:"Acción Bonus: Emites luz solar por 1 minuto.", longDesc:"Tiempo de lanzamiento: 1 Acción Bonus. Emites una luz brillante en un radio de 15 pies y luz tenue 15 pies más allá. Esta luz cuenta como luz solar y dura 1 minuto.", max:1 },
  { name:"Guardián Vigilante", slot:1, type:"Pasiva", req:null, desc:"Al iniciar combate, un aliado cercano gana +1 a su CA.", longDesc:"Cuando ruedas iniciativa, puedes elegir a un aliado que puedas ver. Mientras ese aliado esté a 5 pies de ti, gana un +1 a su CA.", max:1 },
  { name:"Inmortal I", slot:1, type:"Pasiva", req:null, desc:"Acumula TDS contra muerte; con 30 te levantas.", longDesc:"Si te encuentras inconsciente con 0 o menos HP, tus reglas contra muerte cambian. Los resultados de tus TDS contra muerte se suman y acumulan turno a turno, juntando 'puntos de muerte'. Si logras juntar 30 de estos puntos, despiertas con 1 de HP.", max:1 },
  { name:"Inmortal II", slot:1, type:"Pasiva", req:null, desc:"TDS de muerte al inicio de turno; sumas BC; con 19-20 te levantas.", longDesc:"Obtienes los siguientes beneficios: Lanzas TDS contra muerte al inicio de tu turno. Sumas tu bono de competencia a tus TDS contra muerte. Si obtienes un 19 o 20 natural, despiertas con 1 de HP.", max:1 },
  { name:"Mano de Ayuda", slot:1, type:"Activa", req:null, desc:"1 HS, Reacción: Aliado repite tirada de habilidad.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Reacción. Si un aliado a 30 pies falla una tirada de habilidad, puedes usar tu reacción para permitirle que la repita, sumando el bono de tu atributo de esencia al resultado.", max:1 },
  { name:"Preservar la Vida", slot:1, type:"Activa", req:null, desc:"1 HS, Acción: Cura 1d8 + tu atributo de esencia.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Eliges a una criatura a 30 pies. Recibe una cantidad de curación igual a 1d8 + tu modificador de atributo de esencia.", max:1 },
  { name:"Resolución Firme", slot:1, type:"Pasiva", req:null, desc:"Ventaja vs ser movido o derribado.", longDesc:"Tienes ventaja en las tiradas de salvación contra efectos que te moverían en contra de tu voluntad o te derribarían.", max:1 },
  { name:"Salvador Nazareno", slot:1, type:"Pasiva", req:null, desc:"Aumenta tus HS diarios igual a tu atributo de esencia.", longDesc:"Sumas el bono de tu atributo de esencia a la cantidad de HS que posees diariamente.", max:1 },
  { name:"Vínculo Empático", slot:1, type:"Activa", req:null, desc:"Acción Bonus: Un aliado gana ventaja en TDS de Muerte.", longDesc:"Tiempo de lanzamiento: 1 Acción Bonus. Eliges a un aliado a 30 pies. Hasta el final de tu próximo turno, tienes ventaja en las tiradas de Sabiduría (Medicina) hechas para estabilizarlo y él tiene ventaja en sus tiradas de salvación de Muerte.", max:1 }
];
const PROT_T2 = [
  { name:"Aura de Sanación", slot:2, type:"Pasiva", req:"Bendición del Sanador", desc:"Descanso corto: tú y 6 aliados recuperan HP = tu nivel.", longDesc:"Al final de un descanso corto, tú y hasta seis aliados que descansen contigo recuperáis puntos de vida adicionales iguales a tu nivel.", max:1 },
  { name:"Baluarte Inamovible", slot:2, type:"Pasiva", req:"Resolución Firme", desc:"Inmune a ser movido/derribado (consciente).", longDesc:"Te anclas al suelo con una fuerza sobrenatural. Ahora eres inmune a ser movido en contra de tu voluntad o derribado mientras estés consciente.", max:1 },
  { name:"Círculo de Protección", slot:3, type:"Activa", req:"Aura de Confort", desc:"3 HS, Acción: Aura 10 pies (+1 CA, ventaja en salvaciones).", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción. Creas un santuario de 10 pies de radio centrado en ti que dura 1 minuto. Los aliados dentro del círculo tienen un +1 a la CA y ventaja en todas las tiradas de salvación.", max:1 },
  { name:"Intervención Divina", slot:3, type:"Activa", req:"Baluarte Menor", desc:"2 HS, Reacción: Te teletransportas y recibes un ataque por un aliado.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Reacción. Cuando un aliado a 30 pies de ti es golpeado por un ataque, puedes usar tu reacción para teletransportarte a un espacio desocupado a 5 pies de él y convertirte en el objetivo de ese ataque en su lugar.", max:1 },
  { name:"Oleada de Vitalidad", slot:2, type:"Activa", req:"Preservar la Vida", desc:"3 HS, Acción: Cura 2d8 + atributo a todos los aliados a 30 pies.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción. Liberas una oleada de energía curativa. Todos los aliados a 30 pies de ti recuperan 2d8 + tu modificador de atributo de esencia en puntos de vida.", max:1 },
  { name:"Redención del Caído", slot:2, type:"Pasiva", req:"Inmortal II, Vínculo Empático", desc:"Al estabilizar a alguien, recupera 1 HP. Ventaja en TDS de Muerte.", longDesc:"Tu habilidad para traer a otros del borde de la muerte es inigualable. Cuando estabilizas a una criatura moribunda, esta recupera 1 punto de vida. Además, tienes ventaja en las tiradas de salvación de Muerte.", max:1 },
  { name:"Sacrificio del Guardián", slot:2, type:"Activa", req:"Guardián Vigilante", desc:"1 HS, Reacción: Recibes la mitad del daño de un aliado.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Reacción. Cuando un aliado a 15 pies de ti recibe daño, puedes usar tu reacción para recibir tú la mitad de ese daño en su lugar. Este daño no puede ser reducido de ninguna manera.", max:1 },
  { name:"Sello de Invulnerabilidad", slot:2, type:"Activa", req:"Coraza de Fe", desc:"2 HS, Acción: Otorga resistencia a un tipo de daño por 1 min.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Tocas a una criatura voluntaria. Durante 1 minuto, esa criatura gana resistencia a un tipo de daño de tu elección (fuego, frío, ácido, etc.).", max:1 }
];
const PROT_T3 = [
  { name:"Ancora de la Realidad", slot:3, type:"Pasiva", req:"Baluarte Inamovible", desc:"Aura 30 pies: Inmune a teletransporte forzado; ventaja vs conjuros.", longDesc:"Tu presencia estabiliza el tejido mágico a tu alrededor. Tú y todos los aliados a 30 pies de ti no pueden ser teletransportados en contra de su voluntad y tenéis ventaja en las tiradas de salvación contra conjuros.", max:1 },
  { name:"Aura de Vida", slot:5, type:"Pasiva", req:"Aura de Sanación, Oleada de Vitalidad", desc:"Aura 30 pies: curas tu BC a aliados al inicio de tu turno.", longDesc:"Emites un aura de regeneración constante en un radio de 30 pies. Al inicio de tu turno, tú y todos los aliados dentro del aura recuperáis una cantidad de puntos de vida igual a tu bono de competencia.", max:1 },
  { name:"Bastión Inexpugnable", slot:4, type:"Activa", req:"Círculo de Protección, Sello de Invulnerabilidad", desc:"5 HS, Acción: Cúpula inmóvil inmune al daño exterior por 1 min.", longDesc:"Costo de uso: 5 HS. Tiempo de lanzamiento: 1 Acción. Durante 1 minuto, creas una cúpula de luz protectora de 15 pies de radio. La cúpula es inmóvil. Tú y tus aliados dentro de la cúpula sois inmunes a todo el daño proveniente del exterior, y los enemigos no pueden entrar en ella.", max:1 },
  { name:"Resurrección del Mártir", slot:4, type:"Pasiva", req:"Redención del Caído, Sacrificio del Guardián", desc:"Si mueres protegiendo, revives en tu siguiente turno. (1/semana)", longDesc:"Si mueres protegiendo a tus aliados, tu espíritu se niega a abandonarles. Al inicio de tu siguiente turno, vuelves a la vida con la mitad de tus puntos de vida máximos y puedes actuar normalmente. Una vez que usas esta habilidad, no puedes volver a usarla durante 7 días.", max:1 },
  { name:"Vínculo Definitivo", slot:3, type:"Activa", req:"Intervención Divina", desc:"4 HS, Acción: 6 aliados ganan tu Hito de Dominio de 12 slots por 1 hora.", longDesc:"Costo de uso: 4 HS. Tiempo de lanzamiento: 1 Acción. Eliges hasta a seis aliados que puedas ver. Durante 1 hora, mientras estés consciente, cada uno de esos aliados gana los beneficios de tu Hito de Dominio de 12 slots, incluso si tú aún no lo has alcanzado.", max:1 }
];
const CREA_T1 = [
  { name:"Afinidad con una Criatura", slot:1, type:"Activa", req:null, desc:"1 HS: Gana una conexión temporal con una bestia.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Ganas una conexión temporal con una bestia que puedas ver. La bestia debe hacer una salvación de Sabiduría (CD de Esencia). Si falla, te considera un aliado durante 24 horas y puedes comunicarte con ella de forma simple.", max:1 },
  { name:"Compañero Animal", slot:1, type:"Pasiva", req:null, desc:"Obtienes un compañero animal leal (CR 1/4).", longDesc:"Obtienes un compañero animal leal (bestia de CR 1/4 o inferior). El compañero actúa en tu iniciativa y obedece tus órdenes. Si muere, puedes encontrar y vincularte a uno nuevo tras 8 horas.\n\n*Nota de Sinergia: Si ya posees un compañero animal o familiar, esta esencia lo potencia (más vida, más daño y ventaja en salvaciones vs miedo/encanto).*", max:1 },
  { name:"Conexión Elemental", slot:1, type:"Pasiva", req:null, desc:"Elige un elemento: +1 ataque/daño y ventaja en salvaciones.", longDesc:"Eliges un tipo de daño elemental (fuego, frío, etc.). Ganas un +1 a las tiradas de ataque y daño con ese elemento y ventaja en las salvaciones contra él. Puedes cambiar el elemento durante un descanso largo.", max:1 },
  { name:"Disparo Enredador", slot:1, type:"Activa", req:null, desc:"1 HS, Bonus: Tu próximo ataque a distancia puede apresar.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Tu próximo ataque a distancia este turno, si impacta, también invoca enredaderas que intentan apresar al objetivo. Debe hacer una salvación de Fuerza (CD de Esencia) o quedar apresado (restrained) hasta el final de su próximo turno.", max:1 },
  { name:"Don de la Naturaleza", slot:1, type:"Pasiva", req:null, desc:"Gana competencia (o pericia) en Trato con Animales y Naturaleza.", longDesc:"Obtienes competencia en las habilidades de Trato con Animales y Naturaleza. Si ya eres competente en alguna, puedes añadir el doble de tu bono de competencia.", max:1 },
  { name:"Floración Curativa", slot:1, type:"Activa", req:null, desc:"1 HS, Bonus: Cura 1d4 + atributo a un aliado.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Haces que una flor mágica brote a los pies de una criatura a 30 pies. La criatura recupera 1d4 + tu modificador de atributo de esencia en puntos de vida.", max:1 },
  { name:"Forma Arbórea", slot:1, type:"Activa", req:null, desc:"Acción: Te transformas en un arbusto o árbol por 1 hora.", longDesc:"Tiempo de lanzamiento: 1 Acción. Te transformas en un arbusto o un árbol pequeño durante 1 hora. Mientras estés en esta forma, eres indistinguible de un árbol normal. Puedes volver a tu forma normal como una acción.", max:1 },
  { name:"Marca del Cazador", slot:1, type:"Activa", req:null, desc:"1 HS, Bonus: Marca a un enemigo por 1 min (+1d4 daño).", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Marcas a una criatura que puedas ver. Durante 1 minuto, tienes ventaja en las tiradas de Percepción y Supervivencia para encontrarla, y tus ataques contra ella infligen 1d4 de daño adicional.", max:1 },
  { name:"Manipulación de Luz", slot:1, type:"Activa", req:null, desc:"Bonus: Ajusta la luz o crea un destello (1 HS).", longDesc:"Tiempo de lanzamiento: 1 Acción Bonus. Puedes ajustar la intensidad de la luz en un radio de 60 pies, creando penumbra o luz brillante. En combate, puedes gastar 1 HS para crear un destello que da desventaja en el próximo ataque a un enemigo.", max:1 },
  { name:"Oído Agudo", slot:1, type:"Pasiva", req:null, desc:"Ventaja en Percepción basada en el oído.", longDesc:"Tienes ventaja en las tiradas de Sabiduría (Percepción) que dependan del oído.", max:1 },
  { name:"Piel de Corteza", slot:1, type:"Activa", req:null, desc:"1 HS, Bonus: +2 a la CA por 1 turno.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción Bonus. Tu piel adquiere la dureza de la madera. Ganas un +2 a tu CA hasta el inicio de tu próximo turno.", max:1 },
  { name:"Potenciar Sentidos", slot:1, type:"Activa", req:null, desc:"1 HS, Acción: Ventaja en Percepción (un sentido) por 10 min.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Eliges uno de tus sentidos (vista, oído, olfato). Ganas ventaja en todas las tiradas de Percepción basadas en ese sentido durante 10 minutos.", max:1 },
  { name:"Sentir Presencia", slot:1, type:"Activa", req:null, desc:"1 HS, Acción: Siente bestias, fatas o elementales en 1 milla.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Te concentras y puedes sentir la presencia y ubicación general de bestias, fatas o elementales en un radio de 1 milla durante 1 minuto.", max:1 },
  { name:"Toxina Natural", slot:1, type:"Pasiva", req:null, desc:"Crea una dosis de veneno (1d6) durante un descanso corto.", longDesc:"Aprendes a extraer venenos simples de plantas comunes. Durante un descanso corto, puedes crear una dosis de veneno que inflige 1d6 de daño de veneno en el siguiente ataque que impacte.", max:1 }
];
const CREA_T2 = [
  { name:"Compañero Animal Mejorado", slot:2, type:"Pasiva", req:"Compañero Animal", desc:"Compañero CR 1/2 + Multiataque (2).", longDesc:"Tu vínculo con tu compañero se profundiza. Tu compañero animal ahora puede ser una bestia de CR 1/2 o inferior. Adicionalmente, gana la habilidad de atacar dos veces en lugar de una cuando usa la acción de Ataque.", max:1 },
  { name:"Enjambre Vengativo", slot:2, type:"Activa", req:"Toxina Natural", desc:"2 HS, Reacción: 2d10 veneno (CON mitad).", longDesc:"Cuando tú o un aliado a 30 pies de ti recibe daño de una criatura que puedas ver, puedes usar tu reacción para invocar un enjambre de insectos venenosos que ataca al agresor. Este debe hacer una tirada de salvación de Constitución (CD de Esencia), recibiendo 2d10 de daño de veneno si falla, o la mitad si tiene éxito.", max:1 },
  { name:"Espíritu Guardián", slot:3, type:"Activa", req:"Sentir Presencia", desc:"3 HS, Acción: Invoca un espíritu protector por 1 minuto.", longDesc:"Invocas a un espíritu protector con la forma de un animal (oso, lobo, águila). El espíritu aparece en un espacio desocupado a 30 pies y dura 1 minuto. Tiene CA 14, 30 puntos de vida, y puede hacer un ataque cuerpo a cuerpo (tu atributo de esencia para golpear) que inflige 1d8 + tu bono de competencia de daño de fuerza. Actúa en tu iniciativa.", max:1 },
  { name:"Muro de Espinas", slot:3, type:"Activa", req:"Disparo Enredador", desc:"2 HS, Acción: Crea un muro de espinas de 60x10 pies.", longDesc:"Creas un muro de espinas y enredaderas de hasta 60 pies de largo y 10 pies de alto en un punto que puedas ver. El muro es terreno difícil y cualquier criatura que lo cruce recibe 2d6 de daño perforante.", max:1 },
  { name:"Ojo del Depredador", slot:2, type:"Pasiva", req:"Marca del Cazador", desc:"Crítico con 19-20 contra objetivos marcados.", longDesc:"Has perfeccionado tus instintos de caza. Tus ataques a distancia contra una criatura marcada por tu \"Marca del Cazador\" obtienen un golpe crítico con un resultado de 19 o 20 en el dado.", max:1 },
  { name:"Savia Vigorizante", slot:2, type:"Activa", req:"Floración Curativa", desc:"2 HS, Acción: Cura 2d8 HP y elimina una condición.", longDesc:"Eliges a una criatura a 30 pies. Además de recibir 2d8 de curación, la criatura es liberada de una de las siguientes condiciones: cegado, ensordecido o envenenado.", max:1 },
  { name:"Terreno Asfixiante", slot:2, type:"Activa", req:"Conexión Elemental", desc:"2 HS, Acción: Crea un área de terreno difícil que apresa.", longDesc:"Eliges un área de 20 pies cuadrados en el suelo. El área se convierte en terreno difícil. Cualquier criatura que termine su turno en el área debe hacer una salvación de Fuerza (CD de Esencia) o quedar apresada (restrained) hasta el inicio de su próximo turno.", max:1 },
  { name:"Vínculo con la Bestia", slot:2, type:"Pasiva", req:"Afinidad con una Criatura", desc:"Telepatía con bestias; ventaja en Trato con Animales.", longDesc:"Tu conexión con el mundo animal es profunda. Puedes comunicarte telepáticamente con cualquier bestia a 60 pies de ti. Además, tienes ventaja en todas las tiradas de Trato con Animales.", max:1 }
];
const CREA_T3 = [
  { name:"Avatar de la Naturaleza Primordial", slot:5, type:"Activa", req:"Muro de Espinas, Terreno Asfixiante", desc:"5 HS, 1 min. Te transformas en un avatar de la naturaleza.", longDesc:"Costo de uso: 5 HS. Tiempo de lanzamiento: 1 Acción. Durante 1 minuto, te conviertes en un avatar de la naturaleza. Ganas los siguientes beneficios:\n- Tu tamaño se vuelve Grande.\n- Ganas 50 puntos de vida temporales.\n- Al inicio de tu turno, puedes hacer que el suelo en un radio de 30 pies a tu alrededor se convierta en terreno difícil para tus enemigos.\n- Una vez por turno, puedes lanzar el conjuro *Agarre de Enredaderas* sin gastar componentes.", max:1 },
  { name:"Disparo Certero del Alma", slot:4, type:"Activa", req:"Ojo del Depredador", desc:"7 HS, Acción: Disparo que ignora cobertura, es crítico y aturde.", longDesc:"Costo de uso: 7 HS. Tiempo de lanzamiento: 1 Acción. Realizas un único ataque a distancia contra un objetivo. Este ataque ignora la cobertura y cualquier resistencia o inmunidad al daño perforante. Si impacta, es automáticamente un golpe crítico y el objetivo queda aturdido (stunned) hasta el final de tu próximo turno.", max:1 },
  { name:"Invocar Aliado Ancestral", slot:5, type:"Activa", req:"Espíritu Guardián, Vínculo con la Bestia", desc:"6 HS, Acción: Invoca un poderoso espíritu ancestral por 1 hora.", longDesc:"Invocas a un poderoso espíritu ancestral (como un Oso Terrible, un Tigre Dientes de Sable o un Águila Gigante) que lucha a tu lado durante 1 hora. La criatura es leal a ti y a tus compañeros y actúa en su propia iniciativa. Una vez que usas esta habilidad, no puedes volver a usarla hasta completar un descanso largo.", max:1 },
  { name:"Manada de Uno", slot:4, type:"Pasiva", req:"Compañero Animal Mejorado", desc:"Puedes tener dos compañeros animales a la vez.", longDesc:"Tu vínculo con tu compañero es perfecto. Ahora puedes tener dos compañeros animales al mismo tiempo (el segundo debe ser de CR 1/4 o inferior). Ambos actúan en tu misma iniciativa y puedes dividirte los ataques de tu compañero mejorado entre los dos.", max:1 },
  { name:"Renacimiento del Bosque", slot:3, type:"Activa", req:"Savia Vigorizante, Aura de Sanación (Amarilla)", desc:"5 HS, Acción: Cura masiva en área (4d10) y elimina veneno/enfermedad.", longDesc:"Liberas una oleada masiva de energía vital en un radio de 60 pies. Todos los aliados en el área recuperan 4d10 puntos de vida y son curados de cualquier enfermedad o veneno. El área se llena de vegetación exuberante durante 24 horas.", max:1 }
];
const DEST_T1 = [
  { name:"Conocimiento Histórico", slot:1, type:"Activa", req:null, desc:"1 HS: visión de historia del objeto.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Al tocar un objeto, puedes obtener una visión general de su historia, incluyendo detalles sobre su creación, usos anteriores y eventos significativos en los que estuvo involucrado.", max:1 },
  { name:"Encuentro Predestinado", slot:1, type:"Activa", req:null, desc:"1 HS: dirección de persona/objeto clave (3 km).", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Puedes sentir la presencia de una persona u objeto clave para el desarrollo de una misión o evento futuro. Sabes la dirección general en la que se encuentra dentro de un radio de 3 km durante la siguiente hora.", max:1 },
  { name:"Estudio Rápido", slot:1, type:"Pasiva", req:null, desc:"Lectura de contacto a voluntad.", longDesc:"Obtienes Lectura de contacto a voluntad. Al tocar un libro, pergamino u otro medio de conocimiento escrito, puedes absorber la información de forma instantánea.", max:1 },
  { name:"Intuición del Peligro", slot:1, type:"Pasiva", req:null, desc:"Ventaja en salvaciones de DEX contra trampas/conjuros.", longDesc:"Tienes ventaja en las tiradas de salvación de Destreza contra efectos que puedas ver, como trampas y conjuros.", max:1 },
  { name:"Ojo Avizor", slot:1, type:"Pasiva", req:null, desc:"+5 a tu Percepción Pasiva.", longDesc:"Tienes un +5 a tu puntuación de Percepción Pasiva.", max:1 },
  { name:"Presagio", slot:1, type:"Activa", req:null, desc:"Acción: Anota un d20 para reemplazar un ataque.", longDesc:"Tiempo de lanzamiento: 1 Acción. Tiras un d20 y anotas el resultado. Durante el próximo minuto, puedes usar tu reacción para reemplazar una tirada de ataque de una criatura a 30 pies por el resultado que anotaste.", max:1 },
  { name:"Probabilidad Favorable", slot:1, type:"Activa", req:null, desc:"1 HS, Reacción: anula desventaja de una criatura.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Reacción. Cuando tú o una criatura a 30 pies hacen una tirada con desventaja, puedes usar tu reacción para anular la desventaja.", max:1 },
  { name:"Recuperar el Aliento", slot:1, type:"Activa", req:null, desc:"Bonus: Recupera vida igual a tu nivel.", longDesc:"Tiempo de lanzamiento: 1 Acción Bonus. Usas tu acción bonus para forzar al destino y recuperar un ápice de tu vitalidad perdida. Eliges uno de tus HS que ya hayas gastado este día. Recuperas una cantidad de puntos de vida igual a tu nivel. Solo puedes usar esta esencia una vez por descanso corto.", max:1 },
  { name:"Retrasar", slot:1, type:"Activa", req:null, desc:"1 HS, Reacción: retrasa el daño de un ataque.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Reacción. Cuando una criatura a 60 pies es golpeada por un ataque, puedes usar tu reacción para que el daño de ese ataque se aplique al final de su próximo turno en lugar de ahora.", max:1 },
  { name:"Sexto Sentido", slot:1, type:"Pasiva", req:null, desc:"No puedes ser sorprendido mientras estés consciente.", longDesc:"No puedes ser sorprendido mientras estés consciente.", max:1 },
  { name:"Suerte del Principiante", slot:1, type:"Pasiva", req:null, desc:"Gana una competencia de habilidad (cambiable).", longDesc:"Ganas competencia en una habilidad de tu elección. Puedes cambiar esta competencia al finalizar un descanso largo.", max:1 },
  { name:"Visión del Mago", slot:1, type:"Activa", req:null, desc:"Acción: Lee idiomas y detecta magia por 10 min.", longDesc:"Tiempo de lanzamiento: 1 Acción. Durante 10 minutos, puedes leer cualquier idioma que veas y detectar auras mágicas en objetos y criaturas a 30 pies.", max:1 },
  { name:"Vista del Horizonte", slot:1, type:"Activa", req:null, desc:"1 HS, Acción: Visualiza un área lejana por 10 min.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Puedes visualizar un área a una milla de distancia como si estuvieras allí, siempre que hayas visto el lugar antes. Este efecto dura 10 minutos.", max:1 },
  { name:"Voz del Destino", slot:1, type:"Pasiva", req:null, desc:"Gana competencia (o pericia) en Perspicacia (Insight).", longDesc:"Ganas competencia en la habilidad de Perspicacia (Insight). Si ya eres competente, puedes añadir el doble de tu bono de competencia.", max:1 }
];
const DEST_T2 = [
  { name:"Anular la Suerte", slot:2, type:"Activa", req:"Probabilidad Favorable", desc:"2 HS, Reacción: anula ventaja de una criatura.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Reacción. Cuando una criatura a 60 pies de ti hace una tirada con ventaja, puedes usar tu reacción para anular esa ventaja, haciendo que la tirada sea normal.", max:1 },
  { name:"Conocimiento Arcano", slot:2, type:"Pasiva", req:"Estudio Rápido", desc:"Competencia/Pericia Arcanos; copiar conjuros más rápido.", longDesc:"Tu mente procesa información a una velocidad sobrenatural. Ganas competencia en la habilidad de Arcana. Si ya eres competente, puedes añadir el doble de tu bono de competencia. Además, el tiempo que tardas en copiar conjuros a un libro de conjuros se reduce a la mitad.", max:1 },
  { name:"Lazo Kármico", slot:3, type:"Activa", req:"Encuentro Predestinado", desc:"2 HS, Acción: 2 criaturas comparten daño/curación.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Eliges a dos criaturas a 60 pies de ti. Durante 1 minuto, cada vez que una de ellas reciba daño, la otra recibirá la mitad de ese daño. De igual manera, si una de ellas recupera puntos de vida, la otra recupera la mitad de esa cantidad.", max:1 },
  { name:"Momento Oportuno", slot:2, type:"Pasiva", req:"Sexto Sentido", desc:"Tienes ventaja en las tiradas de iniciativa.", longDesc:"Tienes ventaja en las tiradas de iniciativa.", max:1 },
  { name:"Rebobinar Herida", slot:3, type:"Activa", req:"Retrasar", desc:"3 HS, Reacción: niega el daño de un ataque.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Reacción. Cuando una criatura a 60 pies de ti recibe daño, puedes usar tu reacción para negar completamente ese daño, como si el evento nunca hubiera ocurrido. Una vez que usas esta habilidad, no puedes volver a usarla hasta completar un descanso corto.", max:1 },
  { name:"Recuerdo Fotográfico", slot:2, type:"Activa", req:"Conocimiento Histórico", desc:"1 HS, Acción: recuerda una escena con detalle perfecto.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Puedes recordar perfectamente cualquier detalle de una escena que hayas presenciado en las últimas 24 horas. Esto incluye la disposición de objetos, conversaciones escuchadas, o cualquier otro detalle visual o auditivo.", max:1 },
  { name:"Visión del Pasado", slot:2, type:"Activa", req:"Conocimiento Histórico", desc:"1 HS, 10 min: visualiza eventos pasados de un lugar.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 10 Minutos. Puedes visualizar eventos que ocurrieron en un lugar específico dentro de las últimas 24 horas. Estas visiones duran hasta 5 minutos y te muestran escenas clave relacionadas con el área.", max:1 },
  { name:"Visión Verdadera Parcial", slot:3, type:"Activa", req:"Visión del Mago", desc:"2 HS, Acción: ves a través de ilusiones/invisibilidad (30 pies).", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Durante 10 minutos, ganas la capacidad de ver a través de las ilusiones mágicas y la invisibilidad hasta un alcance de 30 pies.", max:1 }
];
const DEST_T3 = [
  { name:"Burbuja Temporal", slot:5, type:"Activa", req:"Rebobinar Herida", desc:"6 HS, Acción: esfera 20 pies 1 min; ralentiza (SAB).", longDesc:"Costo de uso: 6 HS. Tiempo de lanzamiento: 1 Acción. Eliges un punto a 60 pies. Creas una esfera de 20 pies de radio que dura 1 minuto. El tiempo en el interior de la esfera se ralentiza enormemente. Cualquier criatura que entre en la esfera o comience su turno allí debe hacer una tirada de salvación de Sabiduría (CD de Esencia). Si falla, su velocidad se reduce a la mitad y solo puede realizar una acción o una acción bonus en su turno, no ambas.", max:1 },
  { name:"Conocimiento Absoluto", slot:4, type:"Activa", req:"Conocimiento Arcano, Visión del Pasado", desc:"5 HS, 1 min: obtén información significativa sobre algo.", longDesc:"Costo de uso: 5 HS. Tiempo de lanzamiento: 1 Minuto. Nombras a una persona, lugar u objeto. Obtienes un breve resumen de la información significativa sobre el tema, como si hubieras pasado una semana investigando en la mejor biblioteca del multiverso. Una vez que usas esta habilidad, no puedes volver a usarla hasta completar un descanso largo.", max:1 },
  { name:"Manipular el Destino", slot:5, type:"Pasiva", req:"Anular la Suerte, Presagio", desc:"Guarda dos d20 para reemplazar cualquier tirada.", longDesc:"Tu control sobre la probabilidad es casi absoluto. Al final de un descanso largo, tira dos d20 y anota los resultados. En cualquier momento, puedes reemplazar cualquier tirada de ataque, salvación o habilidad hecha por ti o por una criatura que puedas ver con uno de esos dados. Debes elegir usar esta habilidad antes de la tirada. Cada dado solo se puede usar una vez.", max:1 },
  { name:"Paso en el Tiempo", slot:4, type:"Activa", req:"Momento Oportuno", desc:"5 HS, Bonus: desapareces hasta el final de tu próximo turno.", longDesc:"Costo de uso: 5 HS. Tiempo de lanzamiento: 1 Acción Bonus. Te desvaneces del flujo del tiempo y reapareces al final de tu próximo turno en el mismo lugar. Mientras estás fuera del tiempo, eres inmune a todo daño y efecto.", max:1 },
  { name:"Senda de la Profecía", slot:3, type:"Pasiva", req:"Visión Verdadera Parcial", desc:"Ganas Visión Verdadera permanente (60 pies).", longDesc:"Tu capacidad para ver la verdad es permanente. Ganas la capacidad de ver las cosas como realmente son. Puedes ver en la oscuridad normal y mágica, ver criaturas y objetos invisibles, detectar automáticamente las ilusiones visuales y tener éxito en las tiradas de salvación contra ellas, y percibir la forma original de un cambiaformas o una criatura transformada por magia. Tu alcance de visión es de 60 pies.", max:1 }
];
const VINCULO = [
  { name:"Hoja Sanguinaria (Rojo/Negro)", slot:2, type:"Pasiva", req:null, desc:"1/turno, al dañar c/c, +1d6 necrótico y te curas.", longDesc:"Una vez por turno, cuando infliges daño con un arma cuerpo a cuerpo, puedes elegir infligir 1d6 de daño necrótico adicional. Si lo haces, recuperas una cantidad de puntos de vida igual al daño necrótico infligido.", max:1, vinculada:true },
  { name:"Pacto del Dolor (Rojo/Negro)", slot:3, type:"Pasiva", req:null, desc:"Bajo la mitad de HP, tus ataques c/c hacen crítico con 19-20.", longDesc:"Mientras estés por debajo de la mitad de tus puntos de vida, tus ataques con armas cuerpo a cuerpo obtienen un golpe crítico con un resultado de 19 o 20 en el dado.", max:1, vinculada:true },
  { name:"Forma Ilusoria (Azul/Café)", slot:2, type:"Activa", req:null, desc:"2 HS, Bonus: apariencia perfecta de otro humanoide por 1 hora.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción Bonus. Adoptas la apariencia de otra criatura humanoide de tu tamaño que hayas visto. Esta transformación dura 1 hora y es una ilusión perfecta que altera tu apariencia, tu voz y tu ropa. Una tirada de Investigación (CD de Esencia) revela que es una ilusión si interactúas físicamente.", max:1, vinculada:true },
  { name:"Prisión Terrenal (Azul/Café)", slot:3, type:"Activa", req:null, desc:"3 HS, Acción: Apresa y entierra a un enemigo a 60 pies.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción. Eliges a una criatura a 60 pies. El suelo bajo sus pies se vuelve movedizo y unas manos de tierra la agarran. La criatura debe hacer una tirada de salvación de Fuerza (CD de Esencia). Si falla, queda apresada (restrained) y es arrastrada 5 pies bajo tierra. Al inicio de su turno, puede intentar liberarse con otra tirada. Si falla tres veces, queda completamente enterrada y empieza a asfixiarse.", max:1, vinculada:true },
  { name:"Coraza Quitinoide (Café/Negro)", slot:2, type:"Pasiva", req:null, desc:"+1 a la CA; inmune a terreno difícil de veneno/ácido.", longDesc:"Tu piel desarrolla placas de quitina oscura. Ganas un +1 a tu Clase de Armadura. Adicionalmente, eres inmune al terreno difícil causado por efectos de veneno o ácido.", max:1, vinculada:true },
  { name:"Metástasis Adaptativa (Café/Negro)", slot:3, type:"Activa", req:null, desc:"2 HS, Reacción: Gana resistencia al daño elemental recibido.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Reacción. Cuando recibes daño de un tipo elemental (fuego, frío, rayo, etc.), puedes usar tu reacción para desarrollar una resistencia temporal a ese tipo de daño. Ganas resistencia a ese tipo de daño durante 1 minuto. Puedes usar esta habilidad una vez por descanso corto.", max:1, vinculada:true },
  { name:"Baluarte Viviente (Amarillo/Verde)", slot:3, type:"Activa", req:null, desc:"3 HS, Acción: Invoca un golem de madera protector por 1 min.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción. Invocas un golem de madera y enredaderas en un espacio desocupado a 30 pies que dura 1 minuto. El golem tiene CA 15, 50 puntos de vida y la habilidad de usar su reacción para imponer desventaja en un ataque contra un aliado a 5 pies de él.", max:1, vinculada:true },
  { name:"Simbiosis Sagrada (Amarillo/Verde)", slot:2, type:"Pasiva", req:null, desc:"Tú y tu compañero/invocación ganan +1 CA y salvaciones si están cerca.", longDesc:"Cuando tú o tu compañero animal/invocación estáis a 10 pies el uno del otro, ambos obtenéis un +1 a la CA y a las tiradas de salvación.", max:1, vinculada:true },
  { name:"Golpe Inevitable (Burdeo/Rojo)", slot:2, type:"Activa", req:null, desc:"2 HS, Bonus: Tu próximo ataque c/c causa daño máximo.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción Bonus. Tu próximo ataque con arma cuerpo a cuerpo este turno no puede tener desventaja. Si impacta, causa el máximo daño posible de los dados del arma en lugar de tirarlos.", max:1, vinculada:true },
  { name:"Visión de Batalla (Burdeo/Rojo)", slot:3, type:"Pasiva", req:null, desc:"Usa tu atributo de esencia para ataques c/c; crítico con 19-20.", longDesc:"Puedes usar tu modificador de atributo de esencia en lugar de tu Fuerza para las tiradas de ataque y daño con armas cuerpo a cuerpo. Adicionalmente, tus ataques con armas cuerpo a cuerpo obtienen un golpe crítico con un resultado de 19 o 20 en el dado.", max:1, vinculada:true },
  { name:"Bestia Fantasmal (Verde/Azul)", slot:3, type:"Activa", req:null, desc:"3 HS, Acción: Invoca una bestia inmune a daño no mágico.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción. Invocas a una criatura hecha de sombras y niebla que adopta la forma de una bestia de CR 2 o inferior. La criatura es inmune al daño no mágico y tiene resistencia al daño mágico. La invocación dura 1 minuto y desaparece si recibe cualquier cantidad de daño radiante.", max:1, vinculada:true },
  { name:"Canto de Sirena (Verde/Azul)", slot:2, type:"Activa", req:null, desc:"2 HS, Acción: Hechiza a los enemigos hostiles a 30 pies.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Comienzas a cantar una melodía encantadora. Todas las criaturas hostiles a 30 pies que puedan oírte deben hacer una tirada de salvación de Sabiduría (CD de Esencia) o quedar hechizadas (charmed) por ti durante 1 minuto. El efecto termina si tú o tus compañeros actuáis de forma hostil contra ellas.", max:1, vinculada:true },
  { name:"Equilibrio Kármico (Negro/Amarillo)", slot:3, type:"Activa", req:null, desc:"2 HS, Reacción: Devuelve el daño de un crítico a un enemigo.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Reacción. Cuando un enemigo a 30 pies de ti inflige un golpe crítico a un aliado, puedes usar tu reacción para que ese enemigo reciba la misma cantidad de daño que infligió, de tipo necrótico.", max:1, vinculada:true },
  { name:"Sacrificio Expiatorio (Negro/Amarillo)", slot:2, type:"Activa", req:null, desc:"1 HS, Acción: Transfiere una condición a un voluntario.", longDesc:"Costo de uso: 1 HS. Tiempo de lanzamiento: 1 Acción. Tocas a una criatura voluntaria y le transfieres una condición que te afecte (como asustado, envenenado o una enfermedad). La condición termina para ti y la criatura debe sufrirla durante 1 minuto, tras lo cual puede hacer una tirada de salvación para terminar el efecto.", max:1, vinculada:true },
  { name:"Apertura Táctica (Azul/Rojo)", slot:2, type:"Pasiva", req:null, desc:"Al imponer una condición, ganas ventaja en tu próximo ataque c/c.", longDesc:"Cuando usas una esencia para imponer una condición a un enemigo (como derribado, asustado o apresado), tu próximo ataque cuerpo a cuerpo contra esa criatura este turno tiene ventaja.", max:1, vinculada:true },
  { name:"Furia Cerebral (Azul/Rojo)", slot:3, type:"Activa", req:null, desc:"3 HS, Acción: 4d8 daño psíquico y niega reacciones.", longDesc:"Costo de uso: 3 HS. Tiempo de lanzamiento: 1 Acción. Proyectas un asalto psíquico devastador en la mente de una criatura a 60 pies. Debe hacer una tirada de salvación de Inteligencia (CD de Esencia). Si falla, recibe 4d8 de daño psíquico y no puede realizar reacciones hasta el final de tu próximo turno. Si tiene éxito, recibe la mitad del daño.", max:1, vinculada:true },
  { name:"Crecimiento Acelerado (Burdeo/Verde)", slot:2, type:"Activa", req:null, desc:"2 HS, Acción: Un aliado puede gastar 2 Dados de Golpe para curarse.", longDesc:"Costo de uso: 2 HS. Tiempo de lanzamiento: 1 Acción. Tocas a una criatura voluntaria. La criatura envejece físicamente un año, pero su cuerpo se revitaliza. Puede gastar inmediatamente hasta dos de sus Dados de Golpe para curarse, como si hubiera realizado un descanso corto.", max:1, vinculada:true },
  { name:"Presagio Natural (Burdeo/Verde)", slot:3, type:"Activa", req:null, desc:"10 min: Pregunta a la naturaleza y recibe un presagio.", longDesc:"Tiempo de lanzamiento: 10 Minutos. Consultas a los espíritus de la naturaleza sobre un curso de acción específico. Recibes un presagio sobre el resultado de esa acción, que se manifiesta como un 'éxito', un 'fracaso' o 'ambos'. Esta visión no revela detalles, solo el resultado probable.", max:1, vinculada:true }
];

let esencias = [];
let nextId = 1;
function addGroup(constelacion, tier, list){
  list.forEach(e=>{
    esencias.push({
      id: nextId++,
      nombre: e.name,
      constelacion,
      color: colorOf(constelacion),
      tier: tier,
      slots: e.slot,
      costo: e.slot * COSTO_SLOT,
      descripcion: e.desc,
      longDesc: e.longDesc || e.desc,
      req: e.req || null,
      reqNames: parseReqNames(e.req),
      max: e.max ?? 1,
      multipleAllowed: (e.max && e.max>1) ? true : false,
      vinculada: !!e.vinculada,
      disabledGlobally: false
    });
  });
}
addGroup("Furia","I",FURIA_T1); addGroup("Furia","II",FURIA_T2); addGroup("Furia","III",FURIA_T3);
addGroup("Control","I",CONTROL_T1); addGroup("Control","II",CONTROL_T2); addGroup("Control","III",CONTROL_T3);
addGroup("Adaptación","I",ADAPT_T1); addGroup("Adaptación","II",ADAPT_T2); addGroup("Adaptación","III",ADAPT_T3);
addGroup("Corrupción","I",CORR_T1); addGroup("Corrupción","II",CORR_T2); addGroup("Corrupción","III",CORR_T3);
addGroup("Protección","I",PROT_T1); addGroup("Protección","II",PROT_T2); addGroup("Protección","III",PROT_T3);
addGroup("Creación","I",CREA_T1); addGroup("Creación","II",CREA_T2); addGroup("Creación","III",CREA_T3);
addGroup("Destino","I",DEST_T1); addGroup("Destino","II",DEST_T2); addGroup("Destino","III",DEST_T3);
addGroup("Vínculo","—",VINCULO);

/* ---------- Mercado Arcano ---------- */
let mercado = {
  permanentes: [
    { id: 1, nombre: "Expansión de Nexo", cost: 15, desc: "Añade un slot de esencia adicional a tu personaje.", max: 2, remaining: 2 },
    { id: 2, nombre: "Competencia Adicional", cost: 10, desc: "Ganas competencia en una habilidad o herramienta de tu elección.", max: 10, remaining: 10 },
    { id: 3, nombre: "Dote Adicional", cost: 20, desc: "Ganas un dote (feat) de tu elección, si cumples prerrequisitos.", max: 3, remaining: 3 },
    { id: 4, nombre: "Mente Fortificada", cost: 25, desc: "Competencia en una salvación de INT, SAB o CAR.", max: 1, remaining: 1 },
    { id: 5, nombre: "Cuerpo Fortificado", cost: 25, desc: "Competencia en una salvación de FUE, DES o CON.", max: 1, remaining: 1 },
    { id: 6, nombre: "Vitalidad del Héroe", cost: 15, desc: "Tus HP máx. aumentan en tu nivel (+1 por nivel futuro).", max: 1, remaining: 1 },
    { id: 7, nombre: "Pericia Verdadera", cost: 30, desc: "Elige una competencia en habilidad para aplicar Pericia.", max: 2, remaining: 2 },
    { id: 8, nombre: "Iniciativa Legendaria", cost: 15, desc: "Ganas +5 permanente a iniciativa.", max: 1, remaining: 1 },
    { id: 9, nombre: "Resistencia Elemental", cost: 30, desc: "Resistencia a ácido, frío, fuego, rayo o trueno (elige uno).", max: 1, remaining: 1 },
    { id: 10, nombre: "Golpe Aniquilador", cost: 25, desc: "En críticos, tiras un dado de daño de arma adicional.", max: 1, remaining: 1 },
    { id: 11, nombre: "Reserva de Poder", cost: 20, desc: "Tus HS máximos aumentan permanentemente en 3.", max: 1, remaining: 1 }
  ],
  consumibles: [
    { id: 101, nombre: "Fragmento de Esencia", cost: 3, desc: "Bonus: usa una esencia de Tier I que no poseas durante 1 min.", max: 99, remaining: 99 },
    { id: 102, nombre: "Lágrima de Cronos", cost: 5, desc: "Reacción: vuelve a tirar un d20 y quédate con el nuevo.", max: 99, remaining: 99 },
    { id: 103, nombre: "Elixir del Alma", cost: 7, desc: "Acción: recuperas inmediatamente 2 HS gastados.", max: 99, remaining: 99 },
    { id: 104, nombre: "Piedra de la Égida", cost: 4, desc: "Bonus: resistencia a todo el daño hasta tu próximo turno.", max: 99, remaining: 99 },
    { id: 105, nombre: "Incienso del Enfoque", cost: 6, desc: "Tras descanso corto, tu próximo efecto de concentración no la requiere.", max: 99, remaining: 99 }
  ]
};

/* ---------- Estado ---------- */
const state = {
  puntosTotales: 200,
  puntosGastados: 0,
  personajes: {
    A: { key: 'A', name: 'Personaje A', slotsMax: 6, slotsUsados: 0 },
    B: { key: 'B', name: 'Personaje B', slotsMax: 9, slotsUsados: 0 },
    C: { key: 'C', name: 'Personaje C', slotsMax: 12, slotsUsados: 0 },
  },
  compradas: [],
  mercadoComprado: []
};

/* ---------- NUEVO: estado de colapsables ---------- */
const expandedConst = {};   // { "Furia": true/false, ... }
const expandedMercado = {   // claves: "Permanentes", "Consumibles"
  "Permanentes": false,
  "Consumibles": false
};

/* ---------- Init ---------- */
function init() {
  // inputs de configuración
  $('#puntosInput').addEventListener('change', e => { state.puntosTotales = Math.max(0, Number(e.target.value)); refreshResumen(); });
  $$('.slot-input').forEach(inp => {
    const key = inp.dataset.personaje;
    inp.addEventListener('change', e => { state.personajes[key].slotsMax = Math.max(0, Number(e.target.value)); refreshResumen(); });
  });
  $$('.char-name-input').forEach(inp => {
    const key = inp.dataset.personaje;
    inp.addEventListener('input', e => { state.personajes[key].name = e.target.value || `Personaje ${key}`; refreshResumen(); renderMarket(); renderMercado(); });
  });

  // Reset / Export
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Resetear compras?')) return;
    keepScroll(() => {
      state.compradas = [];
      state.mercadoComprado = [];
      Object.values(state.personajes).forEach(p => p.slotsUsados = 0);
      state.puntosGastados = 0;
      esencias.forEach(e=>e.disabledGlobally=false);
      mercado.permanentes.forEach(m=>m.remaining=m.max);
      mercado.consumibles.forEach(m=>m.remaining=m.max);
      // no tocamos expandedConst/expandedMercado para respetar vista del usuario
      refreshResumen(); renderMarket(); renderMercado();
    });
  });
  $('#exportPdfBtn').addEventListener('click', exportPdf);

  // Filtro de constelación
  const filtro = $('#filtroConstelacion');
  CONSTELACIONES.forEach(c => { const opt = document.createElement('option'); opt.value = c.name; opt.textContent = c.name; filtro.appendChild(opt); });
  filtro.addEventListener('change', () => keepScroll(renderMarket));

  // REUBICAR la barra de búsqueda antes del mercado de esencias
  relocateSearchBar();

  // Buscar
  $('#buscador').addEventListener('input', () => keepScroll(renderMarket));

  // Render inicial
  renderMarket();
  renderMercado();
  refreshResumen();
}

/* ---- Reubicar buscador a la sección de Tienda (antes del listado) ---- */
function relocateSearchBar(){
  const tienda = $('#tienda');
  if (!tienda) return;
  const marketList = $('#marketList');
  if (!marketList) return;
  let holder = document.querySelector('#searchHolder');
  if (!holder){
    holder = document.createElement('div');
    holder.id = 'searchHolder';
    holder.style.display = 'grid';
    holder.style.gridTemplateColumns = '1fr auto';
    holder.style.gap = '10px';
    holder.style.margin = '6px 0 10px';
    const label = document.createElement('label');
    label.textContent = 'Buscar esencia';
    label.style.alignSelf = 'center';
    holder.appendChild(label);
    const input = $('#buscador');
    if (input){
      input.style.margin = '0';
      holder.appendChild(input);
    }
    tienda.insertBefore(holder, marketList);
  } else {
    const input = $('#buscador');
    if (input && input.parentElement !== holder) holder.appendChild(input);
  }
}

/* ---------- Util: mantener scroll ----------- */
function keepScroll(fn){
  const y = window.scrollY;
  const x = window.scrollX;
  fn();
  window.scrollTo(x, y);
}

/* ---------- Requisitos ---------- */
function pjTieneEsencia(pjKey, nombre){
  return state.compradas.some(c=>{
    if (c.personajeKey!==pjKey) return false;
    const e = esencias.find(x=>x.id===c.esenciaId);
    return e && e.nombre===nombre;
  });
}
function validarRequisitos(e, pjKey){
  const faltan = (e.reqNames||[]).filter(rn => !pjTieneEsencia(pjKey, rn));
  return {ok: faltan.length===0, faltan};
}

/* ---------- Render ESENCIAS (respeta estados expandido/colapsado) ---------- */
function renderMarket() {
  const q = $('#buscador').value.trim().toLowerCase();
  const filtro = $('#filtroConstelacion').value;
  const marketList = $('#marketList');
  marketList.innerHTML = '';

  CONSTELACIONES.forEach(c => {
    const grupo = esencias.filter(e => {
      if (e.disabledGlobally) return false;
      if (filtro !== 'all' && e.constelacion !== filtro) return false;
      if (q && !(`${e.nombre} ${e.descripcion}`.toLowerCase().includes(q))) return false;
      return e.constelacion === c.name;
    });
    if (!grupo.length) return;

    const header = document.createElement('div');
    header.className = 'collapsible';
    header.innerHTML = `
      ${iconFor(c.name)}
      <span class="constelacionColor" style="background:${c.color}"></span>
      <strong>${c.name}</strong>
      <span style="color:#666;margin-left:8px;font-size:13px">(${grupo.length})</span>
    `;
    marketList.appendChild(header);

    const content = document.createElement('div');
    content.className = 'content';
    const contentInner = document.createElement('div');
    contentInner.className = 'content-inner';
    content.appendChild(contentInner);

    ["I","II","III","—"].forEach(tier=>{
      const lista = grupo.filter(e=>e.tier===tier);
      if (!lista.length) return;

      const th = document.createElement('div');
      th.className = 'tier-header';
      th.innerHTML = `<span style="width:8px;height:8px;background:${c.color};display:inline-block;border-radius:3px;border:1px solid rgba(0,0,0,0.06)"></span> Tier ${tier}`;
      contentInner.appendChild(th);

      const body = document.createElement('div');
      body.className = 'tier-body';

      lista.forEach(e => {
        const row = document.createElement('div');
        row.className = 'item';

        const left = document.createElement('div'); left.style.flex = '1';
        left.innerHTML = `<strong>${e.nombre}</strong> <span class="meta">[Tier ${e.tier}] — ${e.costo} pts — ${e.slots} slot(s)${e.vinculada?' — <span style="color:#8E44AD">Vinculada</span>':''}</span><p>${e.descripcion}${e.req?`<br><em>Req:</em> ${e.req}`:''}</p>`;

        const actions = document.createElement('div'); actions.className='actions';
        const sel = document.createElement('select'); sel.className='input-inline';
        Object.values(state.personajes).forEach(p => {
          const opt = document.createElement('option'); opt.value = p.key; opt.textContent = `${p.name} (${p.slotsUsados}/${p.slotsMax})`;
          sel.appendChild(opt);
        });
        const btnComprar = document.createElement('button'); btnComprar.textContent='Comprar'; btnComprar.onclick = () => buyEsencia(e.id, sel.value);
        const btnExam = document.createElement('button'); btnExam.textContent='Examinar'; btnExam.className='ghost'; btnExam.onclick = ()=>openModalEsencia(e);
        actions.appendChild(sel); actions.appendChild(btnComprar); actions.appendChild(btnExam);

        row.appendChild(left);
        row.appendChild(actions);
        body.appendChild(row);
      });

      contentInner.appendChild(body);
    });

    marketList.appendChild(content);

    // Estado inicial: colapsado salvo que el usuario lo tuviera abierto
    const isOpen = !!expandedConst[c.name];
    if (isOpen) expandSection(header, content); else collapseSection(header, content);

    // Toggle con memorización
    header.addEventListener('click', () => {
      if (header.classList.contains('is-collapsed')) {
        expandedConst[c.name] = true;
        expandSection(header, content);
      } else {
        expandedConst[c.name] = false;
        collapseSection(header, content);
      }
    });

    // Ajuste de altura al redimensionar si está abierto
    window.addEventListener('resize', () => {
      if (!header.classList.contains('is-collapsed')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  });
}

/* ---------- Modal Examinar ---------- */
function openModalEsencia(e){
  $('#modalTitle').textContent = e.nombre + ` — Tier ${e.tier}`;
  $('#modalBody').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="width:12px;height:12px;background:${e.color};display:inline-block;border-radius:3px;border:1px solid rgba(0,0,0,0.06)"></span>
      <strong>${e.constelacion}</strong> — ${e.slots} slot(s) — ${e.costo} pts
    </div>
    ${e.req?`<p><em>Requisitos:</em> ${e.req}</p>`:''}
    <p style="white-space:pre-wrap">${e.longDesc}</p>
  `;
  $('#modalOverlay').style.display='flex';
}
$('#modalClose')?.addEventListener('click', ()=>{ $('#modalOverlay').style.display='none'; });

/* ---------- Mercado Arcano (respeta estado) ---------- */
function renderMercado() {
  const cont = $('#mercadoContainer');
  cont.innerHTML = '';

  const makeSection = (title, items) => {
    const header = document.createElement('div');
    header.className = 'collapsible';
    header.innerHTML = `
      ${iconFor(title === 'Permanentes' ? 'Protección' : 'Destino')}
      <span class="constelacionColor" style="background:#555"></span>
      <strong>${title}</strong>
      <span style="color:#666;margin-left:8px;font-size:13px">(${items.filter(i=>i.remaining>0).length})</span>
    `;
    cont.appendChild(header);

    const content = document.createElement('div');
    content.className = 'content';
    const inner = document.createElement('div'); inner.className='content-inner';
    content.appendChild(inner);

    items.forEach(it => {
      if (title !== 'Permanentes' && it.remaining <= 0) return;
      const row = document.createElement('div'); row.className='item';
      const left = document.createElement('div'); left.style.flex='1';
      left.innerHTML = `<strong>${it.nombre}</strong> <span class="meta"> ${it.cost} pts — Max: ${it.max}${it.max>1?` — Quedan: ${it.remaining}`:''}</span><p>${it.desc}</p>`;
      const actions = document.createElement('div'); actions.className='actions';
      const sel = document.createElement('select');
      Object.values(state.personajes).forEach(p => {
        const opt = document.createElement('option'); opt.value = p.key; opt.textContent = `${p.name} (${p.slotsUsados}/${p.slotsMax})`;
        sel.appendChild(opt);
      });
      const btn = document.createElement('button'); btn.textContent='Comprar'; btn.onclick = ()=>buyMercado(title.toLowerCase(), it.id, sel.value);
      actions.appendChild(sel); actions.appendChild(btn);
      row.appendChild(left); row.appendChild(actions);
      inner.appendChild(row);
    });

    cont.appendChild(content);

    // Estado desde memoria
    const isOpen = !!expandedMercado[title];
    if (isOpen) expandSection(header, content); else collapseSection(header, content);

    header.addEventListener('click', ()=>{
      const open = header.classList.contains('is-collapsed');
      expandedMercado[title] = open;
      if (open) expandSection(header, content);
      else collapseSection(header, content);
    });

    window.addEventListener('resize', ()=>{
      if (!header.classList.contains('is-collapsed')) {
        content.style.maxHeight = content.scrollHeight + 'px';
      }
    });
  };

  makeSection('Permanentes', mercado.permanentes);
  makeSection('Consumibles', mercado.consumibles);
}

/* ---------- Comprar/Quitar/Asignar (mantener scroll y estado) ---------- */
function buyEsencia(esenciaId, personajeKey) {
  const e = esencias.find(x => x.id === esenciaId);
  if (!e) return alert('Esencia no encontrada.');
  const req = validarRequisitos(e, personajeKey);
  if (!req.ok) return alert(`No cumples los requisitos para ${e.nombre}.\nTe falta: ${req.faltan.join(', ')}`);
  if (state.puntosTotales - state.puntosGastados < e.costo) return alert('No tienes puntos suficientes.');
  if (state.personajes[personajeKey].slotsUsados + e.slots > state.personajes[personajeKey].slotsMax) return alert('Ese PJ no tiene slots suficientes.');
  if (state.compradas.find(c => c.esenciaId === esenciaId && c.personajeKey === personajeKey) && !e.multipleAllowed) {
    return alert('Ese personaje ya tiene esta esencia.');
  }

  keepScroll(()=>{
    state.compradas.push({ esenciaId, personajeKey });
    state.puntosGastados += e.costo;
    state.personajes[personajeKey].slotsUsados += e.slots;
    e.disabledGlobally = true; // desaparece del mercado
    refreshResumen();
    renderMarket(); // respeta expandedConst
  });
}

function removeComprada(index) {
  const rec = state.compradas[index];
  if (!rec) return;
  const e = esencias.find(x => x.id === rec.esenciaId);

  keepScroll(()=>{
    state.compradas.splice(index,1);
    state.puntosGastados -= e.costo;
    state.personajes[rec.personajeKey].slotsUsados -= e.slots;

    const sigueComprada = state.compradas.some(c=>c.esenciaId===e.id);
    if (!sigueComprada) e.disabledGlobally = false;

    refreshResumen();
    renderMarket(); // respeta expandedConst
  });
}

function assignEsenciaToOther(index){
  const rec = state.compradas[index];
  if (!rec) return;
  const e = esencias.find(x => x.id === rec.esenciaId);
  openPicker(otherKey=>{
    const req = validarRequisitos(e, otherKey);
    if (!req.ok) { alert(`No cumple requisitos: ${req.faltan.join(', ')}`); return; }
    if (state.personajes[otherKey].slotsUsados + e.slots > state.personajes[otherKey].slotsMax) { alert('Ese PJ no tiene slots suficientes.'); return; }
    if (state.puntosTotales - state.puntosGastados < e.costo) { alert('No tienes puntos suficientes.'); return; }
    if (state.compradas.find(c=>c.esenciaId===e.id && c.personajeKey===otherKey) && !e.multipleAllowed) { alert('Ese PJ ya tiene esta esencia.'); return; }

    keepScroll(()=>{
      state.compradas.push({ esenciaId: e.id, personajeKey: otherKey });
      state.puntosGastados += e.costo;
      state.personajes[otherKey].slotsUsados += e.slots;
      refreshResumen();
    });
  }, rec.personajeKey);
}

/* ---- Mercado ---- */

function buyMercado(tipo, itemId, personajeKey){
  const pool = tipo.startsWith('perman') ? mercado.permanentes : mercado.consumibles;
  const it = pool.find(x=>x.id===itemId);
  if (!it) return;
  if (state.puntosTotales - state.puntosGastados < it.cost) return alert('No tienes puntos suficientes.');

  const isPermanente = tipo.startsWith('perman');

  if (isPermanente){
    const perCharMax = getPerCharMax(it);
    const countForChar = state.mercadoComprado.filter(m => m.itemType==='permanentes' && m.id===itemId && m.personajeKey===personajeKey).length;
    if (countForChar >= perCharMax){
      return alert(`Límite alcanzado para ${it.nombre} (${perCharMax} por personaje).`);
    }
  } else {
    if (it.remaining <= 0) return alert('No queda inventario.');
  }

  keepScroll(()=>{
    state.puntosGastados += it.cost;
    if (!isPermanente) it.remaining -= 1;
    state.mercadoComprado.push({ itemType: isPermanente ? 'permanentes':'consumibles', id:itemId, personajeKey });
    refreshResumen();
    renderMercado();
  });
}



function assignMercadoToOther(index){
  const rec = state.mercadoComprado[index];
  const pool = rec.itemType==='permanentes' ? mercado.permanentes : mercado.consumibles;
  const it = pool.find(x=>x.id===rec.id);
  if (!it) return;

  const isPermanente = rec.itemType==='permanentes';

  openPicker(otherKey=>{
    if (state.puntosTotales - state.puntosGastados < it.cost) { alert('No tienes puntos suficientes.'); return; }

    if (isPermanente){
      const perCharMax = getPerCharMax(it);
      const countForChar = state.mercadoComprado.filter(m => m.itemType==='permanentes' && m.id===it.id && m.personajeKey===otherKey).length;
      if (countForChar >= perCharMax){ alert(`Límite alcanzado para ${it.nombre} (${perCharMax} por personaje).`); return; }
    } else {
      if (it.remaining <= 0) { alert('No queda inventario.'); return; }
    }

    keepScroll(()=>{
      if (!isPermanente) it.remaining -= 1;
      state.puntosGastados += it.cost;
      state.mercadoComprado.push({ itemType: rec.itemType, id: it.id, personajeKey: otherKey });
      refreshResumen();
      renderMercado();
    });
  }, rec.personajeKey);
}


/* ---------- Picker de PJ ---------- */
function openPicker(onPick, excludeKey){
  const overlay = $('#pickerOverlay');
  const buttons = $('#pickerButtons');
  buttons.innerHTML = '';
  Object.values(state.personajes).forEach(p=>{
    if (p.key === excludeKey) return;
    const b = document.createElement('button');
    b.textContent = p.name;
    b.onclick = ()=>{ overlay.style.display='none'; onPick(p.key); };
    buttons.appendChild(b);
  });
  overlay.style.display = 'flex';
}
$('#pickerCancel')?.addEventListener('click', ()=>{ $('#pickerOverlay').style.display='none'; });

/* ---------- Afinidad & Dominio ---------- */
function computeAffAndDomForPJ(pjKey){
  const counts = {};
  const slotsByConst = {};
  state.compradas.forEach(c=>{
    if (c.personajeKey !== pjKey) return;
    const e = esencias.find(x=>x.id===c.esenciaId);
    if (!e || e.vinculada) return;
    counts[e.constelacion] = (counts[e.constelacion]||0) + 1;
    slotsByConst[e.constelacion] = (slotsByConst[e.constelacion]||0) + (e.slots||1);
  });

  const out = [];
  CONSTELACIONES.forEach(c=>{
    if (c.name==="Vínculo") return;
    const count = counts[c.name]||0;
    const slots = slotsByConst[c.name]||0;
    const rule = RULES[c.name] || { affinity:[], affText:[], domain:[], domText:[] };
    const affinities=[]; for (let i=0;i<rule.affinity.length;i++){ if (count>=rule.affinity[i]) affinities.push(rule.affText[i]); }
    const domains=[]; for (let i=0;i<rule.domain.length;i++){ if (slots>=rule.domain[i]) domains.push(rule.domText[i]); }
    out.push({ constelacion:c.name, color:c.color, count, slots, affinities, domains });
  });
  return out;
}

/* ---------- Resumen ---------- */
function refreshResumen(){
  $('#puntosRestantes').innerText = state.puntosTotales - state.puntosGastados;

  const lista = $('#listaCompradas'); lista.innerHTML = '';
  state.compradas.forEach((c,i)=>{
    const e = esencias.find(x=>x.id===c.esenciaId);
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="esenciaTitle">
        <span class="badge" style="background:${e.color}"></span>
        <strong>${e.nombre}</strong>
        <span style="margin-left:auto;font-size:0.9em;color:#555">${state.personajes[c.personajeKey].name}</span>
      </div>
      <div style="font-size:0.9em;color:#444;margin-top:6px">${e.longDesc}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="removeComprada(${i})">Quitar</button>
        <button onclick="assignEsenciaToOther(${i})">Comprar para otro PJ</button>
      </div>
    `;
    lista.appendChild(li);
  });

  const slotsInfo = $('#slotsInfo'); slotsInfo.innerHTML='';
  Object.values(state.personajes).forEach(p=>{
    const li = document.createElement('li');
    li.textContent = `${p.name}: ${p.slotsUsados} / ${p.slotsMax} slots usados`;
    slotsInfo.appendChild(li);
  });

  const afList = $('#afinidadesList'); afList.innerHTML = '';
  Object.values(state.personajes).forEach(p=>{
    const card = document.createElement('div'); card.className='afinidadBox';
    const title = document.createElement('div'); title.innerHTML = `<strong>${p.name}</strong>`;
    card.appendChild(title);

    const arr = computeAffAndDomForPJ(p.key);
    if (!arr.some(r=>r.count>0 || r.slots>0)) {
      const none = document.createElement('div'); none.style.color='#666'; none.style.fontSize='13px'; none.textContent='Sin afinidades o dominios activos.';
      card.appendChild(none);
    } else {
      arr.forEach(r=>{
        if (r.count===0 && r.slots===0) return;
        const box = document.createElement('div');
        box.style.borderLeft = `6px solid ${r.color}`;
        box.style.padding='8px'; box.style.borderRadius='10px'; box.style.background='#fff'; box.style.marginTop='8px';
        box.innerHTML = `<div style="display:flex;align-items:center;gap:8px"><span style="width:10px;height:10px;background:${r.color};display:inline-block;border-radius:3px;border:1px solid rgba(0,0,0,0.06)"></span><strong>${r.constelacion}</strong> — ${r.count} esencias — ${r.slots} slots</div>`;
        if (r.affinities.length) {
          box.innerHTML += `<div style="margin-top:6px"><em>Afinidades:</em><ul style="margin:6px 0 0 18px">${r.affinities.map(a=>`<li>${a}</li>`).join('')}</ul></div>`;
        }
        if (r.domains.length) {
          box.innerHTML += `<div style="margin-top:6px"><em>Dominios:</em><ul style="margin:6px 0 0 18px">${r.domains.map(d=>`<li>${d}</li>`).join('')}</ul></div>`;
        }
        card.appendChild(box);
      });
    }
    afList.appendChild(card);
  });

  const mlist = $('#mercadoComprado'); mlist.innerHTML='';
  state.mercadoComprado.forEach((rec,i)=>{
    const pool = rec.itemType==='permanentes' ? mercado.permanentes : mercado.consumibles;
    const it = pool.find(x=>x.id===rec.id);
    if (!it) return;
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="esenciaTitle">
        <span class="badge" style="background:#555"></span>
        <strong>${it.nombre}</strong>
        <span style="margin-left:auto;font-size:0.9em;color:#555">${state.personajes[rec.personajeKey].name}</span>
      </div>
      <div style="font-size:0.9em;color:#444;margin-top:6px">${it.desc}</div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
        <button onclick="assignMercadoToOther(${i})">Comprar para otro PJ</button>
      </div>
    `;
    mlist.appendChild(li);
  });
}

/* ---------- PDF (diseño + pagebreak limpio) ---------- */
function exportPdf(){
  const doc = document.createElement('div');
  doc.style.fontFamily = 'Georgia, serif';
  doc.style.padding = '18px';
  doc.style.background = '#faf7ef';

  // banner
  const banner = document.createElement('div');
  banner.style.background = 'linear-gradient(90deg,#D4A017,#922B21)';
  banner.style.color = '#fff';
  banner.style.padding = '12px 14px';
  banner.style.borderRadius = '10px';
  banner.style.marginBottom = '10px';
  banner.innerHTML = `<div style="font-size:20px;font-weight:700">Resumen de Build — Nexo de Esencias</div>`;
  doc.appendChild(banner);

  Object.values(state.personajes).forEach(p=>{
    const pjBlock = document.createElement('div');
    pjBlock.style.marginTop='12px';
    pjBlock.style.padding='12px';
    pjBlock.style.border='1px solid #e5dac6';
    pjBlock.style.borderRadius='10px';
    pjBlock.style.background='#fff';
    pjBlock.style.pageBreakInside = 'avoid'; // evita corte del bloque PJ

    const h = document.createElement('div');
    h.style.display='flex';
    h.style.justifyContent='space-between';
    h.style.alignItems='center';
    h.style.margin='0 0 8px 0';
    h.innerHTML = `<h2 style="margin:0;color:#7a2018">${p.name}</h2><div style="color:#6b6158">${p.slotsUsados}/${p.slotsMax} slots</div>`;
    pjBlock.appendChild(h);

    const ul = document.createElement('ul');
    ul.style.marginTop='4px';

    state.compradas.filter(c=>c.personajeKey===p.key).forEach(c=>{
      const e = esencias.find(x=>x.id===c.esenciaId);
      const card = document.createElement('div');
      card.style.border='1px solid #eee';
      card.style.borderLeft=`4px solid ${e.color}`;
      card.style.borderRadius='8px';
      card.style.padding='8px 10px';
      card.style.margin='8px 0';
      card.style.pageBreakInside='avoid'; // evita corte en medio de la carta

      const reqLine = e.req ? `<div><em>Requisitos:</em> ${e.req}</div>` : '';
      card.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:10px;height:10px;background:${e.color};border-radius:3px;border:1px solid rgba(0,0,0,0.06)"></div>
          <strong>${e.nombre}</strong>
          <span style="margin-left:auto;color:#6b6158;font-size:12px">Tier ${e.tier} • ${e.slots} slot(s) • ${e.costo} pts</span>
        </div>
        <div style="color:#7a6a5a;margin:4px 0 2px"><strong>${e.constelacion}</strong>${e.vinculada?' (Vinculada)':''}</div>
        ${reqLine}
        <div style="white-space:pre-wrap">${e.longDesc}</div>
      `;
      ul.appendChild(card);
    });
    pjBlock.appendChild(ul);

    const arr = computeAffAndDomForPJ(p.key);
    const affBox = document.createElement('div'); affBox.style.marginTop='10px';
    affBox.innerHTML = `<div style="font-weight:700;color:#3a2a20;margin-bottom:4px">Afinidades & Dominios</div>`;
    arr.forEach(r=>{
      if (r.count===0 && r.slots===0) return;
      const sub = document.createElement('div');
      sub.style.borderLeft=`4px solid ${r.color}`;
      sub.style.padding='6px 8px';
      sub.style.marginTop='6px';
      sub.style.pageBreakInside='avoid';
      sub.innerHTML = `<strong>${r.constelacion}</strong> — ${r.count} esencias, ${r.slots} slots`;
      if (r.affinities.length) sub.innerHTML += `<div style="margin-top:6px"><em>Afinidades:</em><ul style="margin:6px 0 0 18px">${r.affinities.map(a=>`<li>${a}</li>`).join('')}</ul></div>`;
      if (r.domains.length) sub.innerHTML += `<div style="margin-top:6px"><em>Dominios:</em><ul style="margin:6px 0 0 18px">${r.domains.map(d=>`<li>${d}</li>`).join('')}</ul></div>`;
      affBox.appendChild(sub);
    });
    pjBlock.appendChild(affBox);

    const compras = state.mercadoComprado.filter(m=>m.personajeKey===p.key);
    if (compras.length){
      const mh = document.createElement('h3'); mh.textContent = 'Mercado Arcano'; mh.style.color='#7a2018';
      pjBlock.appendChild(mh);
      const mul = document.createElement('ul');
      compras.forEach(m=>{
        const pool = m.itemType==='permanentes' ? mercado.permanentes : mercado.consumibles;
        const it = pool.find(x=>x.id===m.id);
        if (!it) return;
        const li = document.createElement('li');
        li.style.pageBreakInside='avoid';
        li.innerHTML = `<strong>${it.nombre}</strong> — ${it.desc}`;
        mul.appendChild(li);
      });
      pjBlock.appendChild(mul);
    }

    doc.appendChild(pjBlock);
  });

  const opt = {
    margin: 10,
    filename: 'build_resumen.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    pagebreak: { mode: ['avoid-all','css'] },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(doc).save();
}

/* ---------- DOMContentLoaded ---------- */
document.addEventListener('DOMContentLoaded', init);
