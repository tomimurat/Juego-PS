import { useState, useEffect, useRef, useCallback } from "react";

/* ===============================================================
   TEMA — para el azul de la referencia:
   centro:"#3b9dff", medio:"#0b5fd4", borde:"#062f7a"
   =============================================================== */
const TEMA = {
  centro: "#3ddc97",
  medio: "#0f9d6b",
  borde: "#05452f",
  amarillo: "#ffd028",
  rojo: "#ef2b4d",
  verdeOk: "#27c93f",
};

const TRAZO = "#2d2318";
const SEG_POR_RONDA = 15;

/* Fotos: public/arboles/<clave>.<ext>. Se prueban estas extensiones en orden
   y, si ninguna carga, la ronda usa la ilustración dibujada. */
const EXTENSIONES = ["jpg", "jpeg", "png", "webp", "JPG", "jpeg"];

/* ===============================================================
   DIBUJO PARAMÉTRICO
   Un renderer para todas las especies. El objeto `dibujo` de cada
   árbol define copa, paleta, tronco y adornos.
   =============================================================== */

const COPAS = {
  ancha: (v) => (
    <>
      <ellipse cx="150" cy="128" rx="118" ry="44" fill={v[0]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="106" cy="104" rx="64" ry="38" fill={v[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="194" cy="100" rx="58" ry="36" fill={v[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="150" cy="86" rx="48" ry="30" fill={v[2]} stroke={TRAZO} strokeWidth="6" />
    </>
  ),
  redonda: (v) => (
    <>
      <ellipse cx="150" cy="118" rx="94" ry="76" fill={v[0]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="114" cy="92" rx="50" ry="42" fill={v[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="190" cy="98" rx="46" ry="38" fill={v[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="152" cy="70" rx="40" ry="28" fill={v[2]} stroke={TRAZO} strokeWidth="6" />
    </>
  ),
  conica: (v) => (
    <>
      <path d="M150 10 q52 48 62 86 q-30 12-62 12 q-32 0-62-12 q10-38 62-86z" fill={v[0]} stroke={TRAZO} strokeWidth="6" strokeLinejoin="round" />
      <path d="M150 62 q66 44 80 84 q-36 16-80 16 q-44 0-80-16 q14-40 80-84z" fill={v[1]} stroke={TRAZO} strokeWidth="6" strokeLinejoin="round" />
      <path d="M150 112 q78 40 92 72 q-42 18-92 18 q-50 0-92-18 q14-32 92-72z" fill={v[2]} stroke={TRAZO} strokeWidth="6" strokeLinejoin="round" />
      {[70, 102, 134, 166, 198, 228].map((x, i) => (
        <path key={i} d={`M${x} ${186 + (i % 2) * 6} q-3 18 2 26`} fill="none" stroke={v[0]} strokeWidth="5" strokeLinecap="round" />
      ))}
    </>
  ),
  llorona: (v) => (
    <>
      <ellipse cx="150" cy="96" rx="104" ry="54" fill={v[0]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="116" cy="76" rx="54" ry="34" fill={v[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="188" cy="80" rx="48" ry="30" fill={v[2]} stroke={TRAZO} strokeWidth="6" />
      {[56, 82, 108, 134, 160, 186, 212, 240].map((x, i) => (
        <path key={i} d={`M${x} 132 q${i % 2 ? 12 : -12} ${34 + (i % 3) * 16} ${i % 2 ? 4 : -4} ${58 + (i % 3) * 20}`}
          fill="none" stroke={i % 2 ? v[1] : v[0]} strokeWidth="8" strokeLinecap="round" />
      ))}
    </>
  ),
  rala: (v) => (
    <>
      <ellipse cx="150" cy="134" rx="98" ry="52" fill={v[0]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="104" cy="112" rx="46" ry="32" fill={v[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="196" cy="116" rx="44" ry="30" fill={v[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="150" cy="98" rx="38" ry="24" fill={v[2]} stroke={TRAZO} strokeWidth="6" />
    </>
  ),
};

const TRONCOS = {
  corto: (c) => (
    <>
      <path d="M137 268 q-4-52 2-92 M163 268 q6-48 -2-92" fill="none" stroke={c} strokeWidth="18" strokeLinecap="round" />
      <path d="M137 268 q-4-52 2-92 M163 268 q6-48 -2-92" fill="none" stroke={TRAZO} strokeWidth="6" strokeLinecap="round" />
      <path d="M150 192 l-30-26 M150 178 l32-24" fill="none" stroke={TRAZO} strokeWidth="7" strokeLinecap="round" />
    </>
  ),
  recto: (c) => (
    <>
      <path d="M150 268 l0-118" fill="none" stroke={c} strokeWidth="24" strokeLinecap="round" />
      <path d="M138 266 l0-116 M162 266 l0-116" fill="none" stroke={TRAZO} strokeWidth="5.5" strokeLinecap="round" />
      <path d="M150 198 l-28-22 M150 182 l30-20" fill="none" stroke={TRAZO} strokeWidth="7" strokeLinecap="round" />
    </>
  ),
  multiple: (c) => (
    <>
      <path d="M140 268 q-10-42 -4-74 M158 268 q10-40 2-74 M150 268 q0-44 0-76" fill="none" stroke={c} strokeWidth="14" strokeLinecap="round" />
      <path d="M140 268 q-10-42 -4-74 M158 268 q10-40 2-74 M150 268 q0-44 0-76" fill="none" stroke={TRAZO} strokeWidth="5" strokeLinecap="round" />
    </>
  ),
  zigzag: (c) => (
    <>
      <path d="M150 268 l-12-38 l18-24 l-16-30 l14-28" fill="none" stroke={c} strokeWidth="17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M150 268 l-12-38 l18-24 l-16-30 l14-28" fill="none" stroke={TRAZO} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M138 230 l-38-16 M156 206 l42-20 M140 176 l-36 8" fill="none" stroke={TRAZO} strokeWidth="6" strokeLinecap="round" />
    </>
  ),
};

const ADORNOS = {
  pompon: (x, y, c) => (
    <>
      <circle cx={x} cy={y} r="14" fill={c} stroke={TRAZO} strokeWidth="5" />
      <circle cx={x - 4} cy={y - 4} r="4" fill="#fff" opacity="0.7" />
    </>
  ),
  baya: (x, y, c) => (
    <>
      <circle cx={x} cy={y} r="11" fill={c} stroke={TRAZO} strokeWidth="5" />
      <circle cx={x - 4} cy={y - 4} r="3" fill="#fff" opacity="0.55" />
    </>
  ),
  flor: (x, y, c) => (
    <>
      <circle cx={x} cy={y} r="12" fill={c} stroke={TRAZO} strokeWidth="5" />
      <path d={`M${x - 5} ${y - 6} v12 M${x + 2} ${y - 7} v14`} stroke="#a33c08" strokeWidth="3" />
    </>
  ),
};

const POSICIONES = {
  arbol: [[92, 126], [132, 96], [186, 92], [216, 130], [150, 142], [108, 158], [196, 160]],
  arbusto: [[92, 190], [138, 156], [198, 164], [226, 200], [120, 218], [180, 216], [150, 188]],
  enredadera: [[92, 84], [128, 134], [88, 186], [132, 232], [112, 110], [110, 158], [104, 210]],
  herbacea: [[150, 96], [150, 120], [150, 144], [150, 168], [150, 192], [150, 216], [150, 60]],
};

const Lienzo = ({ children }) => (
  <svg viewBox="0 0 300 300" className="ilu" role="img" aria-label="Ilustración de la especie de esta ronda">
    <ellipse cx="150" cy="268" rx="96" ry="15" fill="#000" opacity="0.1" />
    {children}
  </svg>
);

/* Mata baja, varios tallos desde el suelo, sin tronco definido */
const CuerpoArbusto = (d, adornos) => (
  <>
    <path d="M118 268 q6-40 22-66 M150 268 q0-44 0-72 M182 268 q-6-40 -20-68"
      fill="none" stroke={d.corteza || "#7d5a38"} strokeWidth="11" strokeLinecap="round" />
    <path d="M118 268 q6-40 22-66 M150 268 q0-44 0-72 M182 268 q-6-40 -20-68"
      fill="none" stroke={TRAZO} strokeWidth="4.5" strokeLinecap="round" />
    <g className="copa">
      <ellipse cx="150" cy="192" rx="112" ry="62" fill={d.verdes[0]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="100" cy="166" rx="56" ry="40" fill={d.verdes[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="202" cy="172" rx="52" ry="38" fill={d.verdes[1]} stroke={TRAZO} strokeWidth="6" />
      <ellipse cx="152" cy="146" rx="46" ry="32" fill={d.verdes[2]} stroke={TRAZO} strokeWidth="6" />
      {d.espinas && (
        <>
          <path d="M44 198 l-22-14 M44 198 l-16-22 M256 198 l22-14 M256 198 l16-22" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
          <path d="M44 198 l-22-14 M44 198 l-16-22 M256 198 l22-14 M256 198 l16-22" stroke={TRAZO} strokeWidth="3.5" strokeLinecap="round" />
        </>
      )}
      {adornos}
    </g>
  </>
);

/* Liana que sube por un soporte, con hojas opuestas y zarcillos */
const CuerpoEnredadera = (d, adornos) => (
  <>
    <path d="M226 270 l0-240" fill="none" stroke="#9a7a52" strokeWidth="22" strokeLinecap="round" />
    <path d="M216 268 l0-238 M236 268 l0-238" fill="none" stroke={TRAZO} strokeWidth="5" strokeLinecap="round" />
    <g className="copa">
      <path d="M150 268 q-40-30 -2-60 q42-28 0-58 q-42-30 4-60 q44-28 74-46"
        fill="none" stroke={d.verdes[0]} strokeWidth="10" strokeLinecap="round" />
      <path d="M150 268 q-40-30 -2-60 q42-28 0-58 q-42-30 4-60 q44-28 74-46"
        fill="none" stroke={TRAZO} strokeWidth="4" strokeLinecap="round" />
      {[[150, 236], [148, 180], [152, 124], [176, 76]].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x - 34} cy={y - 6} rx="22" ry="13" fill={d.verdes[1]} stroke={TRAZO} strokeWidth="5"
            transform={`rotate(${i % 2 ? -22 : -34} ${x - 34} ${y - 6})`} />
          <ellipse cx={x + 30} cy={y + 8} rx="20" ry="12" fill={d.verdes[2]} stroke={TRAZO} strokeWidth="5"
            transform={`rotate(${i % 2 ? 26 : 16} ${x + 30} ${y + 8})`} />
          <path d={`M${x + 6} ${y - 4} q18-12 10-24`} fill="none" stroke={TRAZO} strokeWidth="3.5" strokeLinecap="round" />
        </g>
      ))}
      {adornos}
    </g>
  </>
);

/* Mata baja de sotobosque con una espiga erguida */
const CuerpoHerbacea = (d, adornos) => (
  <>
    <g className="copa">
      {[[-70, 14], [-40, -4], [40, -4], [70, 14]].map(([dx, rot], i) => (
        <ellipse key={i} cx={150 + dx} cy={238 + Math.abs(dx) / 6} rx="40" ry="17"
          fill={i % 2 ? d.verdes[1] : d.verdes[0]} stroke={TRAZO} strokeWidth="5.5"
          transform={`rotate(${rot} ${150 + dx} ${238})`} />
      ))}
      <path d="M150 250 l0-206" fill="none" stroke={d.verdes[0]} strokeWidth="9" strokeLinecap="round" />
      <path d="M150 250 l0-206" fill="none" stroke={TRAZO} strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="118" cy="214" rx="34" ry="15" fill={d.verdes[2]} stroke={TRAZO} strokeWidth="5.5" transform="rotate(-18 118 214)" />
      <ellipse cx="182" cy="214" rx="34" ry="15" fill={d.verdes[2]} stroke={TRAZO} strokeWidth="5.5" transform="rotate(18 182 214)" />
      {adornos}
    </g>
  </>
);

const CUERPOS = { arbusto: CuerpoArbusto, enredadera: CuerpoEnredadera, herbacea: CuerpoHerbacea };

function Dibujo({ d }) {
  const forma = d.forma || "arbol";
  const pintar = ADORNOS[d.adorno?.forma] || null;
  const adornos = pintar
    ? POSICIONES[forma].slice(0, d.adorno.cantidad || 5).map(([x, y], i) => (
        <g key={i} className="pompon" style={{ animationDelay: `${i * 0.26}s` }}>{pintar(x, y, d.adorno.color)}</g>
      ))
    : null;

  if (forma !== "arbol") return <Lienzo>{CUERPOS[forma](d, adornos)}</Lienzo>;

  return (
    <Lienzo>
      {TRONCOS[d.tronco](d.corteza || "#8b5e34")}

      {d.placas &&
        [[141, 196], [152, 218], [138, 238], [157, 250]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} q16-7 20 7 q-9 15-23 7z`} fill="#8a6135" stroke={TRAZO} strokeWidth="4" />
        ))}

      {d.aguijones &&
        [[138, 196], [160, 210], [136, 226], [162, 240], [142, 254]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y} l7-13 l7 13z`} fill="#c9a06a" stroke={TRAZO} strokeWidth="3.5" strokeLinejoin="round" />
        ))}

      <g className="copa">
        {COPAS[d.copa](d.verdes)}

        {d.espinas && (
          <>
            <path d="M62 148 l-26-16 M62 148 l-20-24 M238 148 l26-16 M238 148 l20-24" stroke="#fff" strokeWidth="9" strokeLinecap="round" />
            <path d="M62 148 l-26-16 M62 148 l-20-24 M238 148 l26-16 M238 148 l20-24" stroke={TRAZO} strokeWidth="3.5" strokeLinecap="round" />
          </>
        )}

        {adornos}
      </g>

      {d.vaina && (
        <g className="detalle">
          <path d="M40 226 q44-20 84 4 q40 24 74 8 q-4 26-36 26 q-38 0-72-22 q-30-18-50-16z"
            fill={d.vaina} stroke={TRAZO} strokeWidth="6" strokeLinejoin="round" />
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={68 + i * 27} cy={236 + (i % 2 ? 9 : 3)} r="6" fill="rgba(0,0,0,.25)" />
          ))}
        </g>
      )}

      {d.extra === "pajaro" && (
        <g className="pajaro">
          <ellipse cx="212" cy="196" rx="22" ry="16" fill="#2e6fd8" stroke={TRAZO} strokeWidth="5" />
          <circle cx="228" cy="186" r="11" fill="#2e6fd8" stroke={TRAZO} strokeWidth="5" />
          <circle cx="232" cy="184" r="2.6" fill={TRAZO} />
          <path d="M239 187 l12 4 l-12 4z" fill={TEMA.amarillo} stroke={TRAZO} strokeWidth="3.5" strokeLinejoin="round" />
        </g>
      )}

      {d.extra === "semilla" && (
        <>
          <g className="detalle">
            <path d="M34 218 q26-16 48 4 q-16 26-46 22 q-14-14-2-26z" fill="#8a6135" stroke={TRAZO} strokeWidth="5.5" strokeLinejoin="round" />
            <path d="M34 218 q20 8 48 4" fill="none" stroke={TRAZO} strokeWidth="4" />
          </g>
          <g className="semilla">
            <ellipse cx="248" cy="214" rx="30" ry="18" fill="#f3e6c2" stroke={TRAZO} strokeWidth="5" />
            <ellipse cx="248" cy="214" rx="10" ry="8" fill="#8a6135" stroke={TRAZO} strokeWidth="4" />
          </g>
        </>
      )}

      {d.extra === "rombo" && (
        <g className="detalle">
          <path d="M48 216 l32-26 l30 26 l-30 44z" fill="#4e8c3a" stroke={TRAZO} strokeWidth="5.5" strokeLinejoin="round" />
          <path d="M80 190 l0 70" fill="none" stroke={TRAZO} strokeWidth="3.5" />
          <path d="M48 216 l-13-9 M110 216 l13-9 M80 260 l0 14" stroke={TRAZO} strokeWidth="5" strokeLinecap="round" />
        </g>
      )}
    </Lienzo>
  );
}

/* ===============================================================
   ESPECIES — [nombre común, nombre científico, grupo]
   El grupo por defecto es "árbol". Los distractores de una ronda
   siempre salen del mismo grupo que la respuesta correcta.
   =============================================================== */

const E = {
  // ---------- árboles ----------
  algarroboBlanco: ["Algarrobo blanco", "Neltuma alba"],
  algarroboNegro: ["Algarrobo negro", "Neltuma nigra"],
  sauce: ["Sauce criollo", "Salix humboldtiana"],
  cinacina: ["Cina-cina", "Parkinsonia aculeata"],
  espinillo: ["Espinillo", "Vachellia caven"],
  tusca: ["Tusca", "Vachellia aroma"],
  garabatoHembra: ["Garabato hembra", "Senegalia praecox"],
  viscote: ["Viscote", "Parasenegalia visco"],
  molle: ["Molle de beber", "Lithraea molleoides"],
  chanar: ["Chañar", "Geoffroea decorticans"],
  mistol: ["Mistol", "Sarcomphalus mistol"],
  piquillin: ["Piquillín", "Condalia microphylla"],
  tala: ["Tala", "Celtis ehrenbergiana"],
  moradillo: ["Moradillo", "Schinus fasciculatus"],
  sombraToro: ["Sombra de toro", "Jodina rhombifolia"],
  coronillo: ["Coronillo", "Scutia buxifolia"],
  quebrachoBlanco: ["Quebracho blanco", "Aspidosperma quebracho-blanco"],
  orcoQuebracho: ["Orco quebracho", "Schinopsis marginata"],
  guayacan: ["Guayacán", "Libidibia paraguariensis"],
  coco: ["Coco", "Zanthoxylum coco"],
  aguaribay: ["Aguaribay", "Schinus areira"],
  manzanoCampo: ["Manzano del campo", "Ruprechtia apetala"],
  senCampo: ["Sen del campo", "Senna corymbosa"],
  duraznoCampo: ["Durazno del campo", "Kageneckia lanceolata"],
  brea: ["Brea", "Parkinsonia praecox"],
  paloTinta: ["Palo tinta", "Achatocarpus praecox"],
  espinilloNegro: ["Espinillo negro", "Vachellia atramentaria"],
  mato: ["Guayabo colorado", "Myrcianthes cisplatensis"],
  quebrachoColorado: ["Quebracho colorado", "Schinopsis lorentzii"],
  calden: ["Caldén", "Neltuma caldenia"],
  algarroboChileno: ["Algarrobo chileno", "Neltuma chilensis"],
  mistolZorro: ["Mistol del zorro", "Castela coccinea"],
  albaricoque: ["Albaricoque", "Ximenia americana"],
  paloCruz: ["Palo cruz", "Tabebuia nodosa"],
  guindillo: ["Guindillo", "Sebastiania commersoniana"],

  // ---------- arbustos ----------
  laganaPerro: ["Lagaña de perro", "Erythrostemon gilliesii", "arbusto"],
  paloAmarillo: ["Palo amarillo", "Aloysia gratissima", "arbusto"],
  espinaAmarilla: ["Espina amarilla", "Berberis ruscifolia", "arbusto"],
  chilca: ["Chilca", "Baccharis salicifolia", "arbusto"],
  jarilla: ["Jarilla", "Larrea divaricata", "arbusto"],
  romerillo: ["Romerillo", "Heterothalamus alienus", "arbusto"],
  carqueja: ["Carqueja", "Baccharis trimera", "arbusto"],
  duraznillo: ["Hediondillo", "Cestrum parqui", "arbusto"],

  // ---------- enredaderas ----------
  sachaGuasca: ["Sacha guasca", "Dolichandra cynanchoides", "enredadera"],
  peineMono: ["Peine de mono", "Amphilophium carolinae", "enredadera"],
  pasionaria: ["Pasionaria", "Passiflora caerulea", "enredadera"],
  ipomea: ["Dama de noche", "Ipomoea alba", "enredadera"],
  florPatito: ["Flor de patito", "Aristolochia fimbriata", "enredadera"],
  unaGato: ["Uña de gato", "Dolichandra unguis-cati", "enredadera"],
  tasi: ["Tasi", "Araujia odorata", "enredadera"],
  cabelloAngel: ["Cabello de ángel", "Clematis montevidensis", "enredadera"],
  zarzaparrilla: ["Zarzaparrilla colorada", "Muehlenbeckia sagittifolia", "enredadera"],
  isipo: ["Isipó colorado", "Camptosema rubicundum", "enredadera"],

  // ---------- herbáceas ----------
  sangreToro: ["Sangre de toro", "Rivina humilis", "herbácea"],
  peperina: ["Peperina", "Minthostachys verticillata", "herbácea"],
  poleo: ["Poleo", "Lippia turbinata", "herbácea"],
  suico: ["Suico", "Tagetes minuta", "herbácea"],
  tabacoMonte: ["Tabaco del monte", "Trixis praestans", "herbácea"],
  malvaBlanca: ["Malvavisco salmón", "Sphaeralcea bonariensis", "herbácea"],
  marcela: ["Marcela", "Achyrocline satureioides", "herbácea"],
};

const grupoDe = (k) => E[k][2] || "árbol";

const opt = (k) => ({ clave: k, comun: E[k][0], cientifico: E[k][1] });

const MAGNITUDES = {
  1: "Árbol grande: pasa los 15 m. Necesita lugar de sobra — plaza, campo o fondo grande. En vereda angosta rompe todo.",
  2: "Árbol mediano: entre 8 y 15 m. Entra bien en un patio amplio o una plaza chica.",
  3: "Árbol chico: no llega a los 8 m. Va sin problema en vereda, patio o al borde de la huerta.",
};

const CONSIGNAS = {
  "árbol": "¿Qué árbol es?",
  arbusto: "¿Qué arbusto es?",
  enredadera: "¿Qué enredadera es?",
  "herbácea": "¿Qué planta es?",
};

const NIVELES = ["Muy fácil", "Fácil", "Intermedio", "Difícil", "Muy difícil"];

/* ===============================================================
   POOL — 15 especies, 3 por nivel de dificultad
   =============================================================== */

const POOL = [
  /* ---------- NIVEL 1 ---------- */
  {
    clave: "algarroboBlanco", nivel: 1, ex: "ex Prosopis alba", familia: "Fabaceae",
    tipo: "Copa aparasolada, follaje semicaduco", altura: "hasta 18 m de alto y 12 m de copa",
    magnitud: 1, eco: ["Chaco Seco", "Espinal", "Chaco Húmedo", "Monte"],
    pistas: ["Es más ancho que alto. Se abre como un paraguas.", "Da una chaucha amarillenta, chata y dulce.", "Con esa chaucha se hace harina, patay, arrope y aloja."],
    conciencia: "Sus flores alimentan polinizadores y es hospedera de mariposas nocturnas del género Automeris. La tortuga terrestre come sus frutos y dispersa las semillas. Fue árbol sagrado para los pueblos originarios de la región.",
    huerta: "Es leguminosa, igual que el poroto: fija nitrógeno y te mejora el suelo mientras crece.",
    distractores: ["algarroboNegro", "mistol", "chanar", "guayacan", "calden", "algarroboChileno"],
    dibujo: { copa: "ancha", verdes: ["#2f8a44", "#46ad51", "#5fc55e"], tronco: "corto", corteza: "#8b5e34", vaina: "#ffd028" },
  },
  {
    clave: "sauce", nivel: 1, ex: null, familia: "Salicaceae",
    tipo: "Copa llorona de ramas colgantes, follaje caduco", altura: "hasta 20 m",
    magnitud: 1, eco: ["Espinal", "Chaco Seco", "Pampa"],
    pistas: ["Este siempre está al lado del agua.", "Las ramas caen como una cortina hasta casi tocar el suelo.", "Ojo: hay uno criollo y uno importado. Este es el nuestro, el de hoja más fina y angosta."],
    conciencia: "Sostiene las barrancas de ríos y arroyos: sus raíces son lo único que frena la erosión cuando viene la crecida. Es el sauce nativo, distinto del llorón chino que se plantó en todos lados.",
    huerta: "Si tenés una acequia o un bajo que se lava con cada lluvia, este es el que planta el suelo en su lugar.",
    distractores: ["aguaribay", "molle", "cinacina", "guindillo", "mato", "paloTinta"],
    dibujo: { copa: "llorona", verdes: ["#4f9c4a", "#6cbb58", "#8ed06a"], tronco: "recto", corteza: "#9a7a52" },
  },
  {
    clave: "cinacina", nivel: 1, ex: null, familia: "Fabaceae",
    tipo: "Arbolito espinoso de tronco y ramas verdes", altura: "hasta 7 m",
    magnitud: 3, eco: ["Espinal", "Chaco Seco"],
    pistas: ["Mirá el tronco: es verde. El tronco, no las hojas.", "Las hojas son cintas larguísimas que cuelgan como flecos.", "Da una flor amarilla con un pétalo manchado de naranja."],
    conciencia: "Aguanta suelos salinos y anegados donde casi nada prospera, así que es de las primeras en recolonizar bajos arruinados. Su floración larga sostiene abejas durante meses.",
    huerta: "Cerco vivo impenetrable y florido medio año. Si tenés un rincón salitroso donde no agarra nada, va este.",
    distractores: ["espinillo", "tusca", "senCampo", "brea", "espinilloNegro", "paloCruz"],
    dibujo: { copa: "llorona", verdes: ["#78a83c", "#9bc44a", "#b7d962"], tronco: "multiple", corteza: "#93b84a", espinas: true, adorno: { forma: "pompon", color: "#ffd028", cantidad: 5 } },
  },

  /* ---------- NIVEL 2 ---------- */
  {
    clave: "espinillo", nivel: 2, ex: "ex Acacia caven", familia: "Fabaceae",
    tipo: "Arbolito de copa irregular, a veces con varios troncos", altura: "hasta 6 m",
    magnitud: 3, eco: ["Espinal", "Chaco Seco"],
    pistas: ["Es chiquito y está en todos lados: banquinas, alambrados, campos abandonados.", "Tiene espinas blancas, derechas y largas, de a pares.", "En agosto explota en pelotitas amarillas y el perfume se siente de lejos."],
    conciencia: "Es pionera: la primera en volver cuando el suelo quedó arruinado. Su flor sostiene a las abejas al final del invierno, cuando no hay nada más florecido. Ojo con el nombre: acá le decimos aromo, pero el aromo de jardín es Acacia dealbata, australiano.",
    huerta: "Muchos lo topan pensando que es un yuyo. Como cerco vivo frena el viento y te arregla el suelo gratis.",
    distractores: ["tusca", "garabatoHembra", "cinacina", "espinilloNegro", "brea", "albaricoque"],
    dibujo: { copa: "rala", verdes: ["#3f9a4a", "#57b855", "#71cc66"], tronco: "multiple", corteza: "#7d5a38", espinas: true, adorno: { forma: "pompon", color: "#ffd028", cantidad: 7 } },
  },
  {
    clave: "molle", nivel: 2, ex: null, familia: "Anacardiaceae",
    tipo: "Árbol de copa redondeada y follaje resinoso", altura: "hasta 9 m",
    magnitud: 2, eco: ["Chaco Seco", "Espinal"],
    pistas: ["Este es el más famoso de las sierras, pero por mala fama.", "A mucha gente le hace brotar la piel con solo pasar cerca cuando está en flor.", "La hoja es compuesta y el tallito entre los foliolos tiene una alita a los costados."],
    conciencia: "A pesar de la alergia que provoca en gente sensible, es clave en el Chaco Serrano: fija laderas empinadas y sus frutos blanquecinos alimentan zorzales y palomas durante el invierno.",
    huerta: "No lo pongas al lado del cantero donde trabajás. Sí en el límite del terreno, lejos del paso.",
    distractores: ["aguaribay", "moradillo", "manzanoCampo", "paloTinta", "mato", "mistolZorro"],
    dibujo: { copa: "redonda", verdes: ["#35753c", "#4c9645", "#66b055"], tronco: "recto", corteza: "#7a6247", adorno: { forma: "baya", color: "#efe6d2", cantidad: 6 } },
  },
  {
    clave: "algarroboNegro", nivel: 2, ex: "ex Prosopis nigra", familia: "Fabaceae",
    tipo: "Copa globosa y oscura, más densa que la del blanco", altura: "hasta 14 m",
    magnitud: 2, eco: ["Chaco Seco", "Espinal"],
    pistas: ["Es hermano del más famoso de todos, pero más oscuro y más compacto.", "La copa es redonda, no aparasolada, y se ve casi negra desde lejos.", "La chaucha es más corta, gruesa y violácea."],
    conciencia: "Fija nitrógeno igual que su hermano y su fruto es forraje clave en la seca, cuando el campo no da otra cosa. Su madera oscura es la de los muebles y aberturas criollas.",
    huerta: "La sombra más densa del monte seco. Debajo se puede cultivar en verano sin que se queme nada.",
    distractores: ["algarroboBlanco", "mistol", "chanar", "guayacan", "calden", "algarroboChileno"],
    dibujo: { copa: "ancha", verdes: ["#1f6b33", "#2f8a44", "#43a24f"], tronco: "corto", corteza: "#6b4626", vaina: "#b08bd0" },
  },

  /* ---------- NIVEL 3 ---------- */
  {
    clave: "chanar", nivel: 3, ex: null, familia: "Fabaceae",
    tipo: "Árbol erguido de follaje caduco, corteza que se descascara", altura: "hasta 10 m",
    magnitud: 2, eco: ["Chaco Seco", "Espinal", "Monte"],
    pistas: ["A este se lo reconoce por el tronco, no por la copa.", "Se le pela la corteza sola, en placas, y abajo queda verde.", "Da una fruta redonda y dulce con la que se hace un arrope famoso."],
    conciencia: "Rebrota desde la raíz: lo cortás y salen diez alrededor. Así arma los chañarales, que sujetan el suelo donde nada más agarra. Su flor es de las más melíferas del monte seco.",
    huerta: "Sin abejas no hay zapallo, ni melón, ni sandía. Plantar chañar es plantar polinizadores.",
    distractores: ["mistol", "piquillin", "manzanoCampo", "brea", "mistolZorro", "paloCruz"],
    dibujo: { copa: "redonda", verdes: ["#3a8f3f", "#55ad4b", "#6ec25c"], tronco: "recto", corteza: "#a8c94e", placas: true, adorno: { forma: "flor", color: "#f58220", cantidad: 5 } },
  },
  {
    clave: "mistol", nivel: 3, ex: "ex Ziziphus mistol", familia: "Rhamnaceae",
    tipo: "Árbol espinoso de copa redondeada", altura: "hasta 12 m",
    magnitud: 2, eco: ["Chaco Seco", "Espinal"],
    pistas: ["Este da una fruta castaña, dulce, del tamaño de una uva.", "Con esa fruta se hace arrope, se hace bolanchao y hasta se hizo café en épocas de guerra.", "Tiene espinas en pares: una derecha y una ganchuda."],
    conciencia: "Es uno de los pilares alimenticios del monte chaqueño, para la fauna y para la gente. Su madera dura se usó tanto para postes que hoy los ejemplares grandes son raros.",
    huerta: "Fruta comestible sin ningún cuidado, en pleno secano. Y las flores traen abejas todo el verano.",
    distractores: ["chanar", "piquillin", "tala", "coronillo", "guayacan", "albaricoque"],
    dibujo: { copa: "redonda", verdes: ["#2f8038", "#489a42", "#61b252"], tronco: "recto", corteza: "#7d5f3c", espinas: true, adorno: { forma: "baya", color: "#a9702c", cantidad: 6 } },
  },
  {
    clave: "piquillin", nivel: 3, ex: null, familia: "Rhamnaceae",
    tipo: "Arbusto o arbolito muy ramificado y espinoso", altura: "hasta 4 m",
    magnitud: 3, eco: ["Espinal", "Chaco Seco", "Monte"],
    pistas: ["Este es chiquito, enmarañado y pincha por todos lados.", "En diciembre se llena de bolitas rojas dulces que los chicos del campo comen a puñados.", "Las hojas son diminutas, del tamaño de una uña de bebé."],
    conciencia: "Su fruto es de los pocos dulces disponibles en pleno diciembre seco: lo comen aves, zorros y peludos. Bajo su mata espinosa germinan plantines que afuera se comerían las vacas.",
    huerta: "Es la mejor barrera natural que existe: nada ni nadie la atraviesa, y encima da fruta.",
    distractores: ["moradillo", "tala", "mistol", "coronillo", "mistolZorro", "albaricoque"],
    dibujo: { copa: "rala", verdes: ["#4a8f3a", "#63a648", "#7cbc58"], tronco: "multiple", corteza: "#6f5b40", espinas: true, adorno: { forma: "baya", color: "#e0342f", cantidad: 7 } },
  },

  /* ---------- NIVEL 4 ---------- */
  {
    clave: "tala", nivel: 4, ex: "ex Celtis tala", familia: "Cannabaceae",
    tipo: "Arbolito espinoso de ramas en zigzag", altura: "hasta 8 m",
    magnitud: 3, eco: ["Espinal", "Chaco Seco"],
    pistas: ["Lo vieron mil veces y casi nadie sabe cómo se llama.", "Las ramas van en zigzag y donde nace cada hoja hay una espina.", "La hoja es torcida: de un lado arranca más arriba que del otro, y raspa como lija."],
    conciencia: "Es el motor de las aves frugívoras y funciona como planta nodriza: abajo del tala germinan las semillas de otras nativas, protegidas del sol y de la helada. Forma bosques enteros llamados talares.",
    huerta: "Si querés pájaros que se coman las orugas, plantá tala. Es cerco vivo, comedero y guardería.",
    distractores: ["piquillin", "moradillo", "sombraToro", "coronillo", "mistolZorro", "albaricoque"],
    dibujo: { copa: "rala", verdes: ["#35853c", "#4ea648", "#67bd57"], tronco: "zigzag", corteza: "#6d5636", adorno: { forma: "baya", color: "#f2741a", cantidad: 5 }, extra: "pajaro" },
  },
  {
    clave: "moradillo", nivel: 4, ex: null, familia: "Anacardiaceae",
    tipo: "Arbolito de ramas rígidas terminadas en punta", altura: "hasta 5 m",
    magnitud: 3, eco: ["Chaco Seco", "Espinal"],
    pistas: ["El nombre te dice de qué color es el fruto.", "Las ramitas terminan en punta dura, como pinchos cortos.", "Las hojas salen apretadas en manojos sobre la misma rama."],
    conciencia: "Sus frutos morados son alimento de invierno para zorzales y mirlos cuando el monte está pelado. Rebrota rápido después del fuego, así que es de los primeros en volver tras un incendio.",
    huerta: "Compacto y duro: sirve de cortina baja donde no entra un árbol grande.",
    distractores: ["piquillin", "tala", "manzanoCampo", "coronillo", "mistolZorro", "albaricoque"],
    dibujo: { copa: "rala", verdes: ["#417f3b", "#5a9a49", "#73b158"], tronco: "multiple", corteza: "#6b5540", adorno: { forma: "baya", color: "#7b3f9d", cantidad: 6 } },
  },
  {
    clave: "sombraToro", nivel: 4, ex: null, familia: "Santalaceae",
    tipo: "Arbolito de copa densa y hoja durísima", altura: "hasta 6 m",
    magnitud: 3, eco: ["Espinal", "Chaco Seco"],
    pistas: ["La hoja de este no se parece a ninguna otra del monte.", "Es un rombo con tres puntas duras, una a cada lado y una abajo. Pincha de verdad.", "El nombre habla de la sombra que da, chiquita pero muy cerrada."],
    conciencia: "Es hemiparásita: se conecta a las raíces de los árboles vecinos para robarles agua y minerales. Eso lo hace imposible de cultivar solo en maceta, y por eso casi no se lo ve en viveros.",
    huerta: "Este no lo comprás hecho: si querés uno, tiene que nacer al lado de otro árbol que lo banque.",
    distractores: ["tala", "piquillin", "moradillo", "coronillo", "mistolZorro", "albaricoque"],
    dibujo: { copa: "redonda", verdes: ["#2d7038", "#43893f", "#5aa04e"], tronco: "recto", corteza: "#6a5a45", extra: "rombo" },
  },

  /* ---------- NIVEL 5 ---------- */
  {
    clave: "quebrachoBlanco", nivel: 5, ex: null, familia: "Apocynaceae",
    tipo: "Copa cónica de ramas colgantes, follaje perenne", altura: "hasta 20 m",
    magnitud: 1, eco: ["Chaco Seco", "Espinal"],
    pistas: ["No pierde las hojas nunca: en julio está igual que en enero.", "Las hojas salen de a tres y terminan en punta. Pinchan.", "Si le cortás una rama sale un líquido blanco, como leche.", "El fruto parece un coquito de madera y adentro tiene semillas con alita."],
    conciencia: "Tarda décadas en hacerse grande y con su madera se hicieron las varillas de los alambrados de la provincia y el carbón de los asados, que no chispea. Los durmientes del ferrocarril salieron sobre todo de su pariente, el quebracho colorado. Tardó ochenta años en crecer y tarda dos horas en caer.",
    huerta: "No va en una huerta chica, pero sostiene el monte que la rodea: sombra profunda y freno al viento seco.",
    distractores: ["orcoQuebracho", "coco", "mistol", "guayacan", "quebrachoColorado", "paloCruz"],
    dibujo: { copa: "conica", verdes: ["#1f6b46", "#2a8354", "#379a62"], tronco: "recto", corteza: "#8a7257", extra: "semilla" },
  },
  {
    clave: "orcoQuebracho", nivel: 5, ex: null, familia: "Anacardiaceae",
    tipo: "Árbol de copa oscura y madera durísima", altura: "hasta 15 m",
    magnitud: 1, eco: ["Chaco Seco", "Espinal"],
    pistas: ["Este vive casi solamente en las sierras del centro del país. Es nuestro.", "Su nombre empieza con una palabra quechua que significa cerro.", "Es tan duro que postes de alambrado de hace un siglo siguen parados."],
    conciencia: "Es prácticamente exclusivo de las sierras de Córdoba, San Luis y las provincias vecinas, y fue arrasado para leña y carbón. Cada ejemplar grande que queda en pie es un sobreviviente.",
    huerta: "Crece lentísimo, pero un orco quebracho plantado hoy es un acto para tus nietos, no para vos.",
    distractores: ["quebrachoBlanco", "coco", "molle", "guayacan", "quebrachoColorado", "paloCruz"],
    dibujo: { copa: "conica", verdes: ["#1c5a3a", "#256e46", "#316954"], tronco: "recto", corteza: "#6f5a45" },
  },
  {
    clave: "coco", nivel: 5, ex: null, familia: "Rutaceae",
    tipo: "Árbol de tronco cubierto de aguijones cónicos", altura: "hasta 14 m",
    magnitud: 2, eco: ["Chaco Seco", "Espinal"],
    pistas: ["El tronco de este está cubierto de conos de madera con punta. Parece acorazado.", "Si estrujás una hoja, huele a limón. Es pariente del naranjo.", "También le dicen cochucho, y en las sierras se usó siempre como remedio."],
    conciencia: "Es de la familia de los cítricos y por eso es planta hospedera de la mariposa del limonero. Sus aguijones cónicos leñosos no existen en ningún otro árbol del monte cordobés.",
    huerta: "Si tenés limonero, este trae las mismas mariposas — pero nativas, y sin que te coman la cosecha.",
    distractores: ["manzanoCampo", "molle", "orcoQuebracho", "paloTinta", "guayacan", "mistolZorro"],
    dibujo: { copa: "redonda", verdes: ["#367a3c", "#4d9545", "#68ae55"], tronco: "recto", corteza: "#a98a62", aguijones: true },
  },

  /* ============ INCORPORADAS DEL LISTADO DEL VIVERO ============ */

  /* ---------- NIVEL 1 ---------- */
  {
    clave: "aguaribay", nivel: 1, ex: null, familia: "Anacardiaceae",
    tipo: "Árbol de ramas colgantes y follaje perenne aromático", altura: "hasta 15 m",
    magnitud: 2, eco: ["Chaco Seco", "Espinal", "Monte"],
    pistas: ["Las ramas cuelgan como una cortina, pero no es sauce.", "Si estrujás una hoja, huele fuerte, como a pimienta.", "Da racimos de bolitas rosadas que se venden como pimienta rosa."],
    conciencia: "Sus frutos rosados alimentan zorzales y palomas durante todo el otoño. Aguanta sequía, calor y suelo malo como pocos, y por eso terminó plantado en medio país.",
    huerta: "Sombra liviana y perenne. Ojo con la distancia: es voraz con el agua, no lo pongas encima del cantero.",
    distractores: ["molle", "sauce", "moradillo", "mato", "paloTinta", "mistolZorro"],
    dibujo: { copa: "llorona", verdes: ["#3f8a46", "#57a851", "#72bf60"], tronco: "recto", corteza: "#8a7257", adorno: { forma: "baya", color: "#e8617f", cantidad: 6 } },
  },
  {
    clave: "pasionaria", nivel: 1, ex: null, alias: "mburucuyá", familia: "Passifloraceae",
    tipo: "Trepadora con zarcillos, de flor grande y compleja",
    porte: "Trepadora: sube 3 a 6 m sobre cualquier soporte.",
    eco: ["Espinal", "Chaco Seco"],
    pistas: ["Esta no es un árbol: se agarra de lo que encuentre con unos ganchitos en espiral.", "La flor parece un plato con una corona de hilos alrededor del centro.", "Da un fruto anaranjado del tamaño de un huevo, y se come."],
    conciencia: "Es la planta hospedera de la mariposa espejito. Si la plantás, en pocas semanas vas a tener las orugas comiéndole las hojas: eso no es una plaga, es exactamente el punto.",
    huerta: "Fruta comestible, mariposas y cobertura de cerco en la misma planta. De las nativas más agradecidas que hay.",
    distractores: ["sachaGuasca", "peineMono", "ipomea", "tasi", "unaGato", "cabelloAngel"],
    dibujo: { forma: "enredadera", verdes: ["#3f9a4a", "#57b855", "#71cc66"], adorno: { forma: "flor", color: "#b47ad6", cantidad: 5 } },
  },
  {
    clave: "laganaPerro", nivel: 1, ex: "ex Caesalpinia gilliesii", alias: "barba de chivo", familia: "Fabaceae",
    tipo: "Arbusto abierto, sin espinas, de crecimiento rápido",
    porte: "Arbusto de 2 a 3 m. Entra en vereda angosta, cantero o maceta grande.",
    eco: ["Chaco Seco", "Espinal"],
    pistas: ["La flor de esta no se parece a nada del monte: amarilla, con unos hilos rojos larguísimos que salen para afuera.", "En Villa Carlos Paz la tienen como la flor del pueblo.", "El fruto es una chaucha que al secarse explota y dispara las semillas lejos."],
    conciencia: "Sus flores son imán de colibríes y de mariposas nocturnas de lengua larga, las únicas capaces de llegar al fondo de esa corola. Dispara las semillas con un chasquido para alejarlas de la planta madre.",
    huerta: "Colibríes garantizados y aguanta la seca. Si no tenés tierra, va igual en maceta grande.",
    distractores: ["paloAmarillo", "espinaAmarilla", "chilca", "jarilla", "romerillo", "duraznillo"],
    dibujo: { forma: "arbusto", verdes: ["#4a9c45", "#63b552", "#7ccc62"], corteza: "#7d5a38", adorno: { forma: "flor", color: "#ffd028", cantidad: 6 } },
  },

  /* ---------- NIVEL 2 ---------- */
  {
    clave: "senCampo", nivel: 2, ex: null, familia: "Fabaceae",
    tipo: "Arbolito de crecimiento rápido y follaje perenne", altura: "hasta 4 m",
    magnitud: 3, eco: ["Espinal", "Chaco Seco"],
    pistas: ["Este crece rapidísimo: en dos años ya te está dando sombra.", "Se llena de flores amarillas agrupadas en ramilletes, y florece casi todo el año.", "La hoja es compuesta, con pocos foliolos grandes y redondeados."],
    conciencia: "La Municipalidad de Córdoba lo recomienda para veredas angostas justamente porque crece rápido y tiene raíz prolija. Su floración casi continua sostiene abejas cuando el resto del monte ya se apagó.",
    huerta: "Es el más rápido de toda la lista. Si necesitás sombra ya, este es el que plantás.",
    distractores: ["cinacina", "chanar", "espinillo", "brea", "paloCruz", "guindillo"],
    dibujo: { copa: "redonda", verdes: ["#4a9c45", "#63b552", "#7ccc62"], tronco: "multiple", corteza: "#7d6248", adorno: { forma: "pompon", color: "#ffd028", cantidad: 6 } },
  },
  {
    clave: "sachaGuasca", nivel: 2, ex: null, alias: "sacha huasca", familia: "Bignoniaceae",
    tipo: "Liana leñosa perenne, de tallos flexibles y verrugosos",
    porte: "Trepadora: sube de 4 a 10 m sobre árboles, cercos o alambrados.",
    eco: ["Chaco Seco", "Espinal"],
    pistas: ["Esta no crece sola: usa a los otros para subir.", "La flor es un tubo curvo, de un fucsia fuerte, imposible de no ver en el monte serrano.", "Los paisanos ataban los techos de los ranchos con sus tallos, y decían que duraban más que el cuero."],
    conciencia: "Es una de las plantas más típicas de las sierras de Córdoba. Trepa sobre molles, espinillos y chañares sin parasitarlos, y su flor tubular está hecha a medida del pico de los colibríes.",
    huerta: "Tapa un alambrado feo en dos temporadas y te trae picaflores, sin ahogar al árbol que usa de soporte.",
    distractores: ["peineMono", "pasionaria", "ipomea", "unaGato", "tasi", "isipo"],
    dibujo: { forma: "enredadera", verdes: ["#2f8038", "#489a42", "#61b252"], adorno: { forma: "flor", color: "#e0356b", cantidad: 6 } },
  },
  {
    clave: "peineMono", nivel: 2, ex: "ex Pithecoctenium cynanchoides", alias: "sacha esponja", familia: "Bignoniaceae",
    tipo: "Liana leñosa con zarcillos y fruto espinoso",
    porte: "Trepadora: cubre 3 a 8 m de cerco o de copa ajena.",
    eco: ["Chaco Seco", "Espinal"],
    pistas: ["El nombre de esta no viene de la flor, viene del fruto.", "La cápsula se abre en dos mitades cubiertas de púas y queda igual que un peine de madera.", "La flor es blanca con la garganta amarilla, en forma de trompeta curva."],
    conciencia: "Sus cápsulas espinosas liberan semillas con ala de papel que el viento reparte por todo el monte. La flor tubular la trabajan los abejorros grandes, de los pocos con fuerza para abrirla.",
    huerta: "Cerco vivo florido, y el fruto seco es el mejor souvenir que te podés traer de una caminata.",
    distractores: ["sachaGuasca", "pasionaria", "florPatito", "unaGato", "cabelloAngel", "zarzaparrilla"],
    dibujo: { forma: "enredadera", verdes: ["#3a8f3f", "#55ad4b", "#6ec25c"], adorno: { forma: "flor", color: "#f7f2df", cantidad: 5 } },
  },

  /* ---------- NIVEL 3 ---------- */
  {
    clave: "tusca", nivel: 3, ex: "ex Acacia aroma", familia: "Fabaceae",
    tipo: "Arbolito muy espinoso de copa abierta", altura: "hasta 6 m",
    magnitud: 3, eco: ["Chaco Seco", "Espinal"],
    pistas: ["Esta es casi igual al espinillo. La diferencia está en la chaucha.", "La de esta es gruesa, cilíndrica, negra, y queda colgando del árbol todo el año.", "El perfume de la flor es más suave que el del espinillo."],
    conciencia: "Es el sosías del espinillo y por eso casi nadie la nombra. Sus vainas persistentes son alimento de invierno para la fauna y el ganado, cuando ya no queda nada verde en el campo.",
    huerta: "Igual que el espinillo: fija nitrógeno y hace de cerco. Si tenés los dos, vas a terminar distinguiéndolos por la chaucha.",
    distractores: ["espinillo", "garabatoHembra", "viscote", "espinilloNegro", "brea", "albaricoque"],
    dibujo: { copa: "rala", verdes: ["#43a04d", "#5bb957", "#75cf68"], tronco: "multiple", corteza: "#7d5a38", espinas: true, adorno: { forma: "pompon", color: "#ffd028", cantidad: 6 }, vaina: "#3a3128" },
  },
  {
    clave: "manzanoCampo", nivel: 3, ex: null, familia: "Polygonaceae",
    tipo: "Arbusto o arbolito de follaje perenne", altura: "hasta 8 m",
    magnitud: 3, eco: ["Chaco Seco", "Espinal"],
    pistas: ["Este abunda en las faldas de las sierras, mezclado con molles y moradillos.", "No da manzanas: el nombre viene de la forma de la hoja.", "Es de los pocos del monte serrano que no se pela en invierno."],
    conciencia: "Junto al molle y el moradillo forma el trío que sostiene el bosque serrano en las laderas más castigadas. Rebrota después del fuego y aguanta suelo pedregoso donde otros no prenden.",
    huerta: "Perenne y de porte chico: cortina que no se pela justo cuando más necesitás el reparo del viento.",
    distractores: ["molle", "moradillo", "duraznoCampo", "paloTinta", "mato", "mistolZorro"],
    dibujo: { copa: "redonda", verdes: ["#2f7a3a", "#459243", "#5ea952"], tronco: "recto", corteza: "#7a6247" },
  },
  {
    clave: "sangreToro", nivel: 3, ex: null, familia: "Petiveriaceae",
    tipo: "Hierba perenne de sotobosque",
    porte: "Hierba de 30 a 80 cm. Va a media sombra, al pie de otras plantas.",
    eco: ["Chaco Seco", "Espinal"],
    pistas: ["Esta no trepa ni tiene tronco: es una mata baja que vive a la sombra de los demás.", "Da racimos de bolitas rojas brillantes, como cuentas de vidrio.", "El nombre lo dice todo: es por el color de ese fruto."],
    conciencia: "Es de las pocas que fructifica bajo la sombra cerrada del monte, así que alimenta aves chicas justo donde no llega nada más. Sus frutos no son para consumo humano.",
    huerta: "Perfecta para ese rincón donde nunca da el sol y no te crece nada. Y trae pájaros insectívoros al cantero.",
    distractores: ["peperina", "poleo", "suico", "tabacoMonte", "malvaBlanca", "marcela"],
    dibujo: { forma: "herbacea", verdes: ["#3a8f3f", "#55ad4b", "#6ec25c"], adorno: { forma: "baya", color: "#e0342f", cantidad: 6 } },
  },

  /* ---------- NIVEL 4 ---------- */
  {
    clave: "garabatoHembra", nivel: 4, ex: "ex Acacia praecox", familia: "Fabaceae",
    tipo: "Arbolito de silueta grácil y follaje semidenso", altura: "hasta 6 m",
    magnitud: 3, eco: ["Chaco Seco", "Espinal"],
    pistas: ["Las espinas de este son curvas, como uñas de gato.", "Si te enganchás, no zafás tirando: tenés que retroceder.", "La flor es un pompón blanco amarillento, igual que el del espinillo y la tusca.", "La brotación nueva es color óxido."],
    conciencia: "Se confunde todo el tiempo con el espinillo y la tusca, pero la espina curva lo delata. El mantillo de sus hojas es de los mejores fertilizantes naturales del monte.",
    huerta: "Su hojarasca es abono directo: barrela y tirala al cantero en vez de sacarla a la vereda.",
    distractores: ["tusca", "espinillo", "viscote", "espinilloNegro", "brea", "albaricoque"],
    dibujo: { copa: "rala", verdes: ["#357f3d", "#4d9a47", "#66b156"], tronco: "multiple", corteza: "#6f5540", espinas: true, adorno: { forma: "pompon", color: "#f2ecc4", cantidad: 5 } },
  },
  {
    clave: "paloAmarillo", nivel: 4, ex: null, alias: "cedrón de monte", familia: "Verbenaceae",
    tipo: "Arbusto muy ramoso y aromático",
    porte: "Arbusto de 1 a 3 m. Entra en cualquier borde de huerta.",
    eco: ["Chaco Seco", "Espinal"],
    pistas: ["A este lo encontrás con la nariz antes que con los ojos.", "Las flores son chiquitas, blancas, y el perfume se parece al del azahar.", "Por eso también le dicen azahar del campo y cedrón del monte."],
    conciencia: "Es de las plantas más melíferas del monte serrano: cuando florece, el arbusto entero zumba. En la medicina casera cordobesa se usó siempre como digestivo.",
    huerta: "Plantalo al lado del cantero. La nube de abejas que junta te poliniza todo lo que tengas cerca.",
    distractores: ["laganaPerro", "chilca", "espinaAmarilla", "romerillo", "jarilla", "carqueja"],
    dibujo: { forma: "arbusto", verdes: ["#5a9a45", "#74b154", "#8cc766"], corteza: "#9a8a52", adorno: { forma: "baya", color: "#f7f2df", cantidad: 7 } },
  },
  {
    clave: "ipomea", nivel: 4, ex: null, alias: "ipomea", familia: "Convolvulaceae",
    tipo: "Trepadora de tallo fino y flor blanca en trompeta",
    porte: "Trepadora: 3 a 5 m por temporada; se seca arriba en invierno.",
    eco: ["Chaco Seco", "Espinal"],
    pistas: ["Esta abre la flor cuando se pone el sol y la cierra al amanecer.", "La flor es blanca, enorme, de hasta quince centímetros, con forma de trompeta.", "El perfume es dulce y fuerte, y se siente de noche desde lejos."],
    conciencia: "Abre de noche porque la poliniza una mariposa nocturna de trompa larguísima, la única que llega al fondo de esa flor. El perfume y el blanco son señales para un visitante que en la oscuridad no distingue colores.",
    huerta: "Cubre un cerco en una sola temporada y perfuma el patio justo a la hora en que uno se sienta afuera.",
    distractores: ["pasionaria", "sachaGuasca", "florPatito", "cabelloAngel", "zarzaparrilla", "isipo"],
    dibujo: { forma: "enredadera", verdes: ["#4a9c45", "#63b552", "#7ccc62"], adorno: { forma: "flor", color: "#fbf7ea", cantidad: 6 } },
  },

  /* ---------- NIVEL 5 ---------- */
  {
    clave: "viscote", nivel: 5, ex: "ex Acacia visco", familia: "Fabaceae",
    tipo: "Árbol de copa amplia y follaje plumoso, sin una sola espina", altura: "hasta 15 m",
    magnitud: 1, eco: ["Chaco Seco", "Espinal"],
    pistas: ["Este parece un garabato grande. Pero tocalo: no pincha en ningún lado.", "La hoja es plumosa, con decenas de foliolos diminutos.", "En primavera se llena de flores amarillas perfumadas.", "También le dicen arca, y su madera se usó siempre para mueblería."],
    conciencia: "Es de los pocos de su familia que no tiene espinas, lo que lo volvió blanco fácil del hachero. Su hojarasca fina se descompone rápido y arma suelo en laderas pedregosas donde no hay nada.",
    huerta: "Da sombra filtrada: tamiza el sol sin apagar del todo lo que crece abajo, así que podés tener cantero a su pie.",
    distractores: ["garabatoHembra", "tusca", "senCampo", "espinilloNegro", "brea", "albaricoque"],
    dibujo: { copa: "ancha", verdes: ["#4a9c4a", "#63b555", "#7ccc66"], tronco: "recto", corteza: "#9a8468", adorno: { forma: "pompon", color: "#ffd028", cantidad: 4 } },
  },
  {
    clave: "duraznoCampo", nivel: 5, ex: null, familia: "Rosaceae",
    tipo: "Arbolito de follaje perenne y hoja angosta", altura: "hasta 6 m",
    magnitud: 3, eco: ["Chaco Seco", "Espinal"],
    pistas: ["El nombre engaña: no da duraznos, pero es de la misma familia botánica que el durazno.", "La hoja es angosta, larga, con el borde finamente aserrado.", "Es perenne: verde todo el año, en pleno bosque serrano."],
    conciencia: "Es una rosácea nativa de las sierras, pariente del durazno y del manzano de huerta. Crece lento y está poco representado en viveros, así que cada plantín que sale cuenta.",
    huerta: "Perenne, chico y de raíz tranquila: entra en cualquier vereda sin levantar la baldosa.",
    distractores: ["manzanoCampo", "molle", "coco", "paloTinta", "mato", "mistolZorro"],
    dibujo: { copa: "conica", verdes: ["#2c7a48", "#3d9155", "#4fa864"], tronco: "recto", corteza: "#7a6247" },
  },
  {
    clave: "florPatito", nivel: 5, ex: null, familia: "Aristolochiaceae",
    tipo: "Trepadora chica de flor tubular curvada",
    porte: "Trepadora baja: 30 a 80 cm, se seca arriba en invierno.",
    eco: ["Chaco Seco", "Espinal"],
    pistas: ["La flor de esta parece un patito, o un buche de pavo, según a quién le preguntes.", "Es un tubo curvo que termina en una boca abierta, de color pardo violáceo.", "Es la única comida que aceptan las orugas de todo un grupo de mariposas."],
    conciencia: "Es hospedera exclusiva de las mariposas del género Battus. Ojo con una trampa frecuente: la flor de patito exótica que se vende en muchos viveros atrae a las mariposas a poner huevos, pero las orugas mueren al comerla. Confirmá siempre que el plantín sea de la especie nativa.",
    huerta: "Pocas plantas hacen tanto por las mariposas ocupando tan poco espacio.",
    distractores: ["pasionaria", "peineMono", "ipomea", "tasi", "cabelloAngel", "isipo"],
    dibujo: { forma: "enredadera", verdes: ["#3f8a46", "#57a851", "#72bf60"], adorno: { forma: "flor", color: "#9c6b4a", cantidad: 5 } },
  },
];

const PUNTOS_BASE = [10, 15, 20, 25, 30];
const PUNTAJE_MAXIMO = PUNTOS_BASE.reduce((a, b) => a + b, 0) + 5 * (1 + 2 + 3 + 4);

/* ===============================================================
   Armado de partida: una especie por nivel, opciones barajadas
   =============================================================== */

const barajar = (a) => {
  const c = [...a];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
};

/* Chequeo de integridad al cargar el módulo. Con 6 distractores válidos está
   garantizado que siempre quedan al menos 3 después de filtrar los usados. */
POOL.forEach((a) => {
  const rotas = a.distractores.filter((k) => !E[k]);
  if (rotas.length) console.warn(`[quiz] ${E[a.clave][0]}: claves inexistentes → ${rotas.join(", ")}`);
  const validas = a.distractores.filter((k) => E[k]);
  if (validas.length < 6)
    console.warn(`[quiz] ${E[a.clave][0]}: solo ${validas.length} distractores válidos (mínimo 6)`);
  const mezcladas = validas.filter((k) => grupoDe(k) !== grupoDe(a.clave));
  if (mezcladas.length)
    console.warn(`[quiz] ${E[a.clave][0]} es ${grupoDe(a.clave)} pero tiene distractores de otro grupo → ${mezcladas.join(", ")}`);
});

/* Bolsa barajada por nivel (misma idea que el reparto de piezas del Tetris).
   Se saca de a uno; cuando la bolsa se vacía se rebaraja, evitando que el
   primero de la bolsa nueva sea el último que salió. Garantiza que ninguna
   especie se repita entre partidas seguidas y que las tres de cada nivel
   salgan una vez cada tres partidas, sin volverse predecible.
   Vive en memoria: si se recarga la página, la rotación arranca de cero. */
const bolsas = NIVELES.map(() => []);
const ultimoSacado = NIVELES.map(() => null);

function sacarDeBolsa(indiceNivel) {
  if (!bolsas[indiceNivel].length) {
    const nueva = barajar(POOL.filter((a) => a.nivel === indiceNivel + 1).map((a) => a.clave));
    if (nueva.length > 1 && nueva[0] === ultimoSacado[indiceNivel]) {
      const j = 1 + Math.floor(Math.random() * (nueva.length - 1));
      [nueva[0], nueva[j]] = [nueva[j], nueva[0]];
    }
    bolsas[indiceNivel] = nueva;
  }
  const clave = bolsas[indiceNivel].shift();
  ultimoSacado[indiceNivel] = clave;
  return POOL.find((a) => a.clave === clave);
}

/* consumir=false arma una partida de relleno sin tocar las bolsas. Se usa
   solo para el estado inicial, que nunca se muestra porque el juego entra
   por la pantalla de atracción y empezar() siempre rearma. */
function armarPartida(consumir = true) {
  const elegidos = NIVELES.map((_, i) =>
    consumir ? sacarDeBolsa(i) : POOL.find((a) => a.nivel === i + 1)
  );
  const usados = elegidos.map((a) => a.clave);

  return elegidos.map((a) => {
    const posibles = a.distractores.filter((k) => E[k] && !usados.includes(k));
    if (posibles.length < 3)
      console.warn(`[quiz] ${E[a.clave][0]}: la ronda se armó con ${posibles.length} distractores en vez de 3`);
    const distractores = posibles.slice(0, 3).map(opt);
    const opciones = barajar([opt(a.clave), ...distractores]);
    return {
      ...a,
      nombre: E[a.clave][0],
      cientifico: E[a.clave][1],
      grupo: grupoDe(a.clave),
      opciones,
      correcta: opciones.findIndex((o) => o.clave === a.clave),
    };
  });
}

/* ===============================================================
   Sonido — generado con Web Audio, sin archivos
   =============================================================== */

function useSonido(mudo) {
  const ctxRef = useRef(null);

  const ctx = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctxRef.current = new AC();
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const nota = useCallback((frec, inicio, dur, tipo = "sine", vol = 0.18) => {
    const c = ctx();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frec, c.currentTime + inicio);
    g.gain.setValueAtTime(0, c.currentTime + inicio);
    g.gain.linearRampToValueAtTime(vol, c.currentTime + inicio + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + inicio + dur);
    osc.connect(g).connect(c.destination);
    osc.start(c.currentTime + inicio);
    osc.stop(c.currentTime + inicio + dur + 0.05);
  }, [ctx]);

  const barrido = useCallback((desde, hasta, dur, vol = 0.16) => {
    const c = ctx();
    if (!c) return;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(desde, c.currentTime);
    osc.frequency.exponentialRampToValueAtTime(hasta, c.currentTime + dur);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
    osc.connect(g).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur + 0.05);
  }, [ctx]);

  return {
    despertar: () => ctx(),
    click: () => !mudo && nota(680, 0, 0.06, "square", 0.08),
    acierto: (racha = 1) => {
      if (mudo) return;
      [523.25, 659.25, 783.99].forEach((f, i) => nota(f, i * 0.075, 0.22, "triangle", 0.2));
      if (racha >= 3) [1046.5, 1318.5].forEach((f, i) => nota(f, 0.24 + i * 0.07, 0.25, "sine", 0.14));
    },
    error: () => !mudo && barrido(220, 110, 0.38),
    tic: () => !mudo && nota(880, 0, 0.05, "square", 0.07),
    arranque: () => {
      if (mudo) return;
      [392, 523.25, 659.25, 783.99].forEach((f, i) => nota(f, i * 0.09, 0.28, "triangle", 0.17));
    },
    final: () => {
      if (mudo) return;
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(f, i * 0.12, 0.5, "triangle", 0.2));
      nota(1318.5, 0.5, 0.8, "sine", 0.16);
    },
  };
}

/* ===============================================================
   Piezas visuales
   =============================================================== */

function useCountUp(valor, ms = 700) {
  const [mostrado, setMostrado] = useState(valor);
  const desde = useRef(valor);
  useEffect(() => {
    const a = desde.current, b = valor;
    if (a === b) return;
    let raf, t0;
    const paso = (t) => {
      if (!t0) t0 = t;
      const p = Math.min(1, (t - t0) / ms);
      setMostrado(Math.round(a + (b - a) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(paso);
      else desde.current = b;
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, ms]);
  return mostrado;
}

const COLORES_CONFETI = ["#ffd028", "#ef2b4d", "#ffffff", "#27c93f", "#37a6ff", "#ff8a1f"];

function Confeti({ semilla }) {
  const [piezas] = useState(() =>
    Array.from({ length: 34 }, (_, i) => ({
      i, x: Math.random() * 100, d: Math.random() * 0.45, dur: 1.5 + Math.random() * 0.9,
      c: COLORES_CONFETI[i % COLORES_CONFETI.length], w: 8 + Math.random() * 8, h: 12 + Math.random() * 10,
    }))
  );
  return (
    <div className="confeti" key={semilla} aria-hidden="true">
      {piezas.map((p) => (
        <span key={p.i} style={{ left: `${p.x}%`, background: p.c, width: p.w, height: p.h, animationDelay: `${p.d}s`, animationDuration: `${p.dur}s` }} />
      ))}
    </div>
  );
}

function Reloj({ restante, corriendo }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const p = Math.max(0, restante / SEG_POR_RONDA);
  const apremio = corriendo && restante <= 5;
  return (
    <div className={`reloj ${apremio ? "apremio" : ""}`}>
      <svg width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
        <circle cx="38" cy="38" r={r} fill="rgba(0,0,0,.22)" stroke="rgba(255,255,255,.28)" strokeWidth="8" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={apremio ? TEMA.rojo : TEMA.amarillo} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - c * p}
          transform="rotate(-90 38 38)" style={{ transition: "stroke-dashoffset .95s linear, stroke .2s" }} />
      </svg>
      <span className="relojNum">{corriendo ? Math.ceil(restante) : "–"}</span>
    </div>
  );
}

/* ===============================================================
   Juego
   =============================================================== */

export default function JuegoArbolesNativos() {
  const [pantalla, setPantalla] = useState("atraccion"); // atraccion | juego | final
  const [partida, setPartida] = useState(() => armarPartida(false));
  const [ronda, setRonda] = useState(0);
  const [elegida, setElegida] = useState(null);
  const [fase, setFase] = useState("pregunta"); // pregunta | revelado | ficha
  const [puntaje, setPuntaje] = useState(0);
  const [racha, setRacha] = useState(0);
  const [mejorRacha, setMejorRacha] = useState(0);
  const [historial, setHistorial] = useState([]);
  const [verPistas, setVerPistas] = useState(false);
  const [mudo, setMudo] = useState(false);
  const [intentoFoto, setIntentoFoto] = useState({}); // clave → extensión que se está probando
  const [restante, setRestante] = useState(SEG_POR_RONDA);
  const [corriendo, setCorriendo] = useState(false);
  const [vidriera, setVidriera] = useState(0);

  const snd = useSonido(mudo);
  const arbol = partida[ronda];
  const acerto = elegida !== null && elegida === arbol.correcta;
  const puntajeAnimado = useCountUp(puntaje);
  const timer = useRef(null);
  const resuelto = useRef(false); // evita que teclado y reloj resuelvan la misma ronda dos veces

  /* --- vidriera de la pantalla de atracción --- */
  useEffect(() => {
    if (pantalla !== "atraccion") return;
    const id = setInterval(() => setVidriera((v) => (v + 1) % POOL.length), 2600);
    return () => clearInterval(id);
  }, [pantalla]);

  /* --- cuenta regresiva ---
     El updater solo descuenta: tiene que ser puro porque StrictMode lo
     invoca dos veces. Los efectos de borde van en el useEffect de abajo. */
  useEffect(() => {
    if (!corriendo || fase !== "pregunta") return;
    const id = setInterval(() => setRestante((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, [corriendo, fase, ronda]);

  useEffect(() => {
    if (!corriendo || fase !== "pregunta") return;
    if (restante > 0 && restante <= 5) snd.tic();
    if (restante === 0) resolver(-1);
  }, [restante, corriendo, fase]); // eslint-disable-line

  useEffect(() => () => clearTimeout(timer.current), []);

  function resolver(i) {
    if (fase !== "pregunta" || resuelto.current) return;
    resuelto.current = true;
    const bien = i === arbol.correcta;
    const ganados = bien ? PUNTOS_BASE[ronda] + racha * 5 : 0;
    const nuevaRacha = bien ? racha + 1 : 0;

    setCorriendo(false);
    setElegida(i);
    setFase("revelado");
    setPuntaje((p) => p + ganados);
    setRacha(nuevaRacha);
    setMejorRacha((m) => Math.max(m, nuevaRacha));
    setHistorial((h) => [...h, { clave: arbol.clave, nombre: arbol.nombre, bien, ganados }]);
    setVerPistas(false);

    bien ? snd.acierto(nuevaRacha) : snd.error();
    timer.current = setTimeout(() => setFase("ficha"), bien ? 950 : 1500);
  }

  function siguiente() {
    snd.click();
    if (ronda === partida.length - 1) {
      snd.final();
      setPantalla("final");
      return;
    }
    resuelto.current = false;
    setRonda((r) => r + 1);
    setElegida(null);
    setFase("pregunta");
    setVerPistas(false);
    setRestante(SEG_POR_RONDA);
    setCorriendo(false);
  }

  function empezar() {
    snd.despertar();
    snd.arranque();
    clearTimeout(timer.current);
    resuelto.current = false;
    setPartida(armarPartida());
    setRonda(0); setElegida(null); setFase("pregunta"); setPuntaje(0);
    setRacha(0); setMejorRacha(0); setHistorial([]); setVerPistas(false);
    setRestante(SEG_POR_RONDA); setCorriendo(false);
    setPantalla("juego");
  }

  function alternarReloj() {
    if (fase !== "pregunta") return;
    snd.click();
    setCorriendo((c) => !c);
  }

  /* --- teclado ---
     El handler vive en un ref que se reasigna en cada render, así siempre
     lee el estado fresco, pero el listener se monta y desmonta una sola vez. */
  const teclado = useRef(null);
  teclado.current = (e) => {
    const k = e.key.toLowerCase();
    if (k === "m") { setMudo((v) => !v); return; }
    if (pantalla === "atraccion") {
      if (k === " " || k === "enter") { e.preventDefault(); empezar(); }
      return;
    }
    if (pantalla === "final") {
      if (k === " " || k === "enter" || k === "r") { e.preventDefault(); empezar(); }
      if (k === "escape") setPantalla("atraccion");
      return;
    }
    if (k === "escape") { clearTimeout(timer.current); setPantalla("atraccion"); return; }
    if (k === "r") { empezar(); return; }
    if (k === "t") { alternarReloj(); return; }
    if (k === "p" && fase === "pregunta") { setVerPistas((v) => !v); return; }
    if (["1", "2", "3", "4"].includes(k) && fase === "pregunta") { resolver(Number(k) - 1); return; }
    if ((k === " " || k === "enter") && fase === "ficha") { e.preventDefault(); siguiente(); }
  };

  useEffect(() => {
    const onKey = (e) => teclado.current?.(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const estilos = (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,800;0,900;1,700&display=swap');
      html, body, #root { margin: 0; padding: 0; min-height: 100%; }
      .pq{--amar:${TEMA.amarillo};--rojo:${TEMA.rojo};--ok:${TEMA.verdeOk};
        position:relative;min-height:100vh;overflow:hidden;color:#fff;
        font-family:'Nunito','Trebuchet MS','Segoe UI',system-ui,sans-serif;font-weight:800;
        background:radial-gradient(circle at 50% 36%, ${TEMA.centro} 0%, ${TEMA.medio} 52%, ${TEMA.borde} 100%);}
      .pq *{box-sizing:border-box;}
      .rayos{position:absolute;inset:-40%;pointer-events:none;opacity:.16;
        background:repeating-conic-gradient(from 0deg at 50% 50%, #fff 0deg 7deg, transparent 7deg 18deg);
        animation:girar 70s linear infinite;}
      @keyframes girar{to{transform:rotate(360deg)}}
      .rombo{position:absolute;pointer-events:none;background:rgba(255,255,255,.09);border-radius:14px;animation:flotar linear infinite;}
      @keyframes flotar{0%{transform:translateY(40px) rotate(45deg)}50%{transform:translateY(-40px) rotate(70deg)}100%{transform:translateY(40px) rotate(45deg)}}

      .lienzo{position:relative;z-index:2;max-width:1180px;margin:0 auto;padding:20px 20px 40px;}

      /* ---------- atracción ---------- */
      .atraccion{position:relative;z-index:2;min-height:100vh;display:grid;place-items:center;
        text-align:center;padding:30px 22px;cursor:pointer;}
      .atrTitulo{font-size:clamp(38px,9vw,92px);font-weight:900;text-transform:uppercase;line-height:.92;
        letter-spacing:-.03em;text-shadow:0 7px 0 rgba(0,0,0,.25);margin:0;}
      .atrTitulo em{font-style:normal;color:var(--amar);display:block;}
      .vidriera{width:min(300px,62vw);margin:18px auto 6px;background:#fff;border-radius:32px;padding:12px;
        box-shadow:0 12px 0 rgba(0,0,0,.2);animation:respirarCarta 4s ease-in-out infinite;}
      @keyframes respirarCarta{0%,100%{transform:translateY(0) rotate(-1.2deg)}50%{transform:translateY(-12px) rotate(1.2deg)}}
      .llamada{display:inline-block;margin-top:14px;background:var(--amar);color:#3b2f00;border:none;
        border-radius:999px;padding:18px 44px;font:inherit;font-size:clamp(18px,3vw,28px);font-weight:900;
        text-transform:uppercase;box-shadow:0 8px 0 #c69f00;cursor:pointer;animation:pulsar 1.7s ease-in-out infinite;}
      @keyframes pulsar{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
      .ayudaTeclas{margin-top:22px;font-size:13px;font-weight:800;opacity:.72;text-transform:uppercase;letter-spacing:.05em;}
      .ayudaTeclas kbd{background:rgba(0,0,0,.3);border-radius:6px;padding:2px 8px;margin:0 2px;font:inherit;font-size:12px;}

      /* ---------- cabecera ---------- */
      .cab{display:flex;align-items:center;gap:16px;flex-wrap:wrap;}
      .num{width:64px;height:64px;flex:none;border-radius:999px;background:var(--rojo);display:grid;place-items:center;
        font-size:32px;font-weight:900;box-shadow:0 6px 0 rgba(0,0,0,.28);animation:aparecerPop .5s cubic-bezier(.34,1.56,.64,1) both;}
      .titulo{font-size:clamp(20px,3.3vw,34px);font-weight:900;letter-spacing:-.02em;text-transform:uppercase;
        line-height:1;text-shadow:0 4px 0 rgba(0,0,0,.22);margin:0;}
      .titulo em{font-style:normal;color:var(--amar);}
      .pildora{display:inline-block;background:var(--rojo);font-weight:900;text-transform:uppercase;font-size:14px;
        letter-spacing:.04em;padding:6px 16px;border-radius:999px;box-shadow:0 4px 0 rgba(0,0,0,.25);margin-top:8px;}
      .marcadores{margin-left:auto;display:flex;align-items:center;gap:12px;}
      .marcador{background:rgba(0,0,0,.2);border:3px solid rgba(255,255,255,.28);border-radius:18px;padding:6px 16px;text-align:center;line-height:1.05;}
      .marcador b{display:block;font-size:30px;font-weight:900;color:var(--amar);}
      .marcador span{font-size:11px;text-transform:uppercase;letter-spacing:.06em;opacity:.85;}
      .rachaViva{animation:latir .55s cubic-bezier(.34,1.56,.64,1);}
      @keyframes latir{0%{transform:scale(1)}40%{transform:scale(1.22)}100%{transform:scale(1)}}
      .reloj{position:relative;display:grid;place-items:center;cursor:pointer;}
      .reloj svg{display:block}
      .relojNum{position:absolute;font-size:24px;font-weight:900;color:#fff;}
      .reloj.apremio{animation:latir .95s ease-in-out infinite;}
      .iconoBtn{background:rgba(0,0,0,.22);border:3px solid rgba(255,255,255,.28);border-radius:999px;
        width:46px;height:46px;font-size:19px;cursor:pointer;color:#fff;display:grid;place-items:center;}

      .pasos{display:flex;gap:7px;margin-top:14px;}
      .paso{height:9px;flex:1;border-radius:999px;background:rgba(0,0,0,.22);transition:background .35s;}
      .paso.ok{background:var(--ok)}.paso.mal{background:var(--rojo)}.paso.hoy{background:var(--amar)}

      .tablero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.12fr);gap:26px;margin-top:20px;align-items:start;}
      @media (max-width:880px){.tablero{grid-template-columns:1fr}}

      .tarjeta{background:#fff;border-radius:28px;padding:14px;box-shadow:0 10px 0 rgba(0,0,0,.2);
        animation:entrarIzq .55s cubic-bezier(.34,1.4,.64,1) both;}
      .tarjeta.bien{box-shadow:0 10px 0 rgba(0,0,0,.2),0 0 0 8px var(--ok);}
      .tarjeta.mal{box-shadow:0 10px 0 rgba(0,0,0,.2),0 0 0 8px var(--rojo);animation:temblar .45s;}
      .ilu{display:block;width:100%;height:auto;}
      .foto{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:18px;background:#e9e5da;}
      .ilu .copa{transform-origin:150px 250px;animation:mecer 5.5s ease-in-out infinite;}
      .ilu .detalle{animation:respirar 4s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
      .ilu .pompon{transform-origin:center;transform-box:fill-box;animation:respirar 2.6s ease-in-out infinite;}
      .ilu .pajaro{animation:picotear 3.4s ease-in-out infinite;transform-origin:center;transform-box:fill-box;}
      .ilu .semilla{animation:planear 6s ease-in-out infinite;transform-box:fill-box;}
      @keyframes mecer{0%,100%{transform:rotate(-1.4deg)}50%{transform:rotate(1.4deg)}}
      @keyframes respirar{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
      @keyframes picotear{0%,86%,100%{transform:rotate(0)}90%{transform:rotate(-12deg)}94%{transform:rotate(3deg)}}
      @keyframes planear{0%,100%{transform:translate(0,0) rotate(-6deg)}50%{transform:translate(-14px,16px) rotate(8deg)}}
      .pieIlu{border-top:3px dashed #e3e0d8;margin-top:10px;padding-top:10px;color:#8b8578;font-size:13px;
        font-weight:800;text-transform:uppercase;letter-spacing:.03em;}

      .pistaBtn{margin-top:14px;background:rgba(0,0,0,.22);border:3px solid rgba(255,255,255,.3);color:#fff;
        font:inherit;font-weight:900;text-transform:uppercase;font-size:13px;letter-spacing:.05em;
        border-radius:999px;padding:9px 20px;cursor:pointer;}
      .pistas{margin:12px 0 0;padding:16px 18px 16px 38px;background:rgba(0,0,0,.25);border-radius:20px;animation:entrarAbajo .35s ease-out both;}
      .pistas li{margin:6px 0;font-size:17px;font-weight:700;line-height:1.35;}
      .pistas li::marker{color:var(--amar);font-weight:900;}

      .consigna{font-size:clamp(22px,3vw,32px);font-weight:900;text-transform:uppercase;text-shadow:0 4px 0 rgba(0,0,0,.22);margin:0 0 14px;}
      .opciones{display:flex;flex-direction:column;gap:13px;}
      .opcion{position:relative;width:100%;text-align:left;background:#fff;border:none;border-radius:22px;
        padding:14px 20px 14px 62px;cursor:pointer;font:inherit;color:#241f17;box-shadow:0 7px 0 #b9b3a4;
        transition:transform .12s,box-shadow .12s,background .25s;animation:entrarDer .45s cubic-bezier(.34,1.4,.64,1) both;}
      .opcion:hover:not(:disabled){transform:translateY(-3px);box-shadow:0 10px 0 #b9b3a4;}
      .opcion:active:not(:disabled){transform:translateY(5px);box-shadow:0 2px 0 #b9b3a4;}
      .opcion:disabled{cursor:default;}
      .tecla{position:absolute;left:16px;top:50%;transform:translateY(-50%);width:32px;height:32px;border-radius:10px;
        background:#efece2;color:#8b8578;display:grid;place-items:center;font-size:16px;font-weight:900;}
      .opcion .comun{display:block;font-size:clamp(19px,2.4vw,26px);font-weight:900;text-transform:uppercase;line-height:1.05;}
      .opcion .sci{display:block;font-style:italic;font-weight:700;font-size:13px;color:#8b8578;margin-top:2px;}
      .opcion.correcta{background:var(--ok);box-shadow:0 7px 0 #17902b;color:#fff;animation:saltar .5s cubic-bezier(.34,1.6,.64,1);}
      .opcion.errada{background:var(--rojo);box-shadow:0 7px 0 #ac1330;color:#fff;animation:temblar .45s;}
      .opcion.correcta .sci,.opcion.errada .sci{color:rgba(255,255,255,.85)}
      .opcion.correcta .tecla,.opcion.errada .tecla{background:rgba(255,255,255,.28);color:#fff;}
      .opcion.apagada{opacity:.4;}
      .marca{position:absolute;right:18px;top:50%;transform:translateY(-50%);font-size:28px;font-weight:900;}

      .ficha{animation:entrarAbajo .45s cubic-bezier(.34,1.3,.64,1) both;}
      .veredicto{font-size:clamp(24px,3.4vw,38px);font-weight:900;text-transform:uppercase;margin:0;text-shadow:0 4px 0 rgba(0,0,0,.22);}
      .nombreGrande{font-size:clamp(28px,4.6vw,50px);font-weight:900;text-transform:uppercase;line-height:1;
        color:var(--amar);text-shadow:0 5px 0 rgba(0,0,0,.25);margin:4px 0 2px;}
      .sciGrande{font-style:italic;font-weight:700;font-size:clamp(14px,1.8vw,19px);opacity:.92;margin:0 0 14px;}
      .fila{background:#fff;color:#241f17;border-radius:20px;padding:11px 18px;margin-bottom:9px;
        box-shadow:0 5px 0 rgba(0,0,0,.18);animation:entrarDer .4s cubic-bezier(.34,1.3,.64,1) both;}
      .fila h3{margin:0 0 2px;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:.07em;color:#a09887;}
      .fila p{margin:0;font-size:16px;font-weight:700;line-height:1.35;}
      .chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:5px;}
      .chip{background:#efece2;color:#5f5949;border-radius:999px;padding:3px 13px;font-size:13px;font-weight:900;}
      .chip.dom{background:var(--amar);color:#3b2f00;}

      .siguiente{margin-top:6px;width:100%;background:var(--amar);color:#3b2f00;border:none;border-radius:22px;
        padding:16px;font:inherit;font-size:clamp(18px,2.4vw,24px);font-weight:900;text-transform:uppercase;
        cursor:pointer;box-shadow:0 7px 0 #c69f00;transition:transform .12s,box-shadow .12s;}
      .siguiente:hover{transform:translateY(-3px);box-shadow:0 10px 0 #c69f00;}
      .siguiente:active{transform:translateY(5px);box-shadow:0 2px 0 #c69f00;}
      .ganancia{text-align:center;margin:10px 0 0;font-size:17px;font-weight:900;color:var(--amar);animation:saltar .5s cubic-bezier(.34,1.6,.64,1) both;}

      .confeti{position:fixed;inset:0;pointer-events:none;z-index:50;overflow:hidden;}
      .confeti span{position:absolute;top:-30px;border-radius:3px;animation-name:caer;animation-timing-function:ease-in;animation-fill-mode:forwards;}
      @keyframes caer{to{transform:translateY(105vh) rotate(720deg);opacity:.1}}

      .final{position:relative;z-index:2;max-width:820px;margin:0 auto;padding:44px 22px;text-align:center;}
      .podio{display:flex;justify-content:center;gap:14px;flex-wrap:wrap;margin:24px 0;}
      .podio div{background:rgba(0,0,0,.22);border:4px solid rgba(255,255,255,.28);border-radius:26px;padding:16px 26px;
        min-width:150px;animation:aparecerPop .55s cubic-bezier(.34,1.5,.64,1) both;}
      .podio b{display:block;font-size:46px;font-weight:900;color:var(--amar);line-height:1;}
      .podio span{font-size:12px;text-transform:uppercase;letter-spacing:.07em;opacity:.88;}
      .repaso{list-style:none;margin:0 0 24px;padding:0;text-align:left;}
      .repaso li{display:flex;align-items:center;gap:12px;background:rgba(0,0,0,.2);border-radius:18px;padding:10px 16px;
        margin-bottom:8px;font-size:17px;font-weight:800;text-transform:uppercase;animation:entrarDer .4s cubic-bezier(.34,1.3,.64,1) both;}
      .repaso .pts{margin-left:auto;color:var(--amar);font-weight:900;}
      .cierreTexto{font-size:17px;font-weight:700;line-height:1.5;opacity:.95;max-width:62ch;margin:0 auto 22px;}

      @keyframes aparecerPop{from{opacity:0;transform:scale(.55)}to{opacity:1;transform:scale(1)}}
      @keyframes entrarIzq{from{opacity:0;transform:translateX(-26px) scale(.96)}to{opacity:1;transform:none}}
      @keyframes entrarDer{from{opacity:0;transform:translateX(26px)}to{opacity:1;transform:none}}
      @keyframes entrarAbajo{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
      @keyframes saltar{0%{transform:scale(1)}45%{transform:scale(1.07)}100%{transform:scale(1)}}
      @keyframes temblar{0%,100%{transform:translateX(0)}18%{transform:translateX(-11px)}38%{transform:translateX(9px)}58%{transform:translateX(-6px)}78%{transform:translateX(4px)}}
      @media (prefers-reduced-motion: reduce){.pq *,.pq *::before,.pq *::after{animation:none !important;transition:none !important;}}
      .pq :focus-visible{outline:5px solid #fff;outline-offset:4px;}
    `}</style>
  );

  const fondo = (
    <>
      <div className="rayos" aria-hidden="true" />
      {[
        { l: "6%", t: "14%", s: 74, d: 9 }, { l: "88%", t: "10%", s: 52, d: 11 },
        { l: "12%", t: "72%", s: 60, d: 13 }, { l: "80%", t: "66%", s: 86, d: 10 },
        { l: "48%", t: "86%", s: 44, d: 12 }, { l: "66%", t: "22%", s: 36, d: 8 },
      ].map((r, i) => (
        <span key={i} className="rombo" aria-hidden="true"
          style={{ left: r.l, top: r.t, width: r.s, height: r.s, animationDuration: `${r.d}s`, animationDelay: `${i * 0.7}s` }} />
      ))}
    </>
  );

  /* ---------- ATRACCIÓN ---------- */
  if (pantalla === "atraccion") {
    return (
      <div className="pq">
        {estilos}
        {fondo}
        <div className="atraccion" onClick={empezar} role="button" tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && empezar()}>
          <div>
            <span className="pildora">Feria de huertas · 5 rondas</span>
            <h1 className="atrTitulo">¿Conocés<em>tus nativas?</em></h1>
            <div className="vidriera"><Dibujo d={POOL[vidriera].dibujo} /></div>
            <p style={{ fontSize: "clamp(15px,2.2vw,20px)", fontWeight: 800, opacity: 0.92, margin: "10px 0 0" }}>
              Treinta nativas de Córdoba. Cada partida es distinta.
            </p>
            <button className="llamada" onClick={(e) => { e.stopPropagation(); empezar(); }}>Tocá para jugar</button>
            <p className="ayudaTeclas">
              <kbd>1-4</kbd> responder · <kbd>T</kbd> reloj · <kbd>P</kbd> pistas · <kbd>espacio</kbd> seguir ·
              <kbd>R</kbd> reiniciar · <kbd>M</kbd> sonido · <kbd>Esc</kbd> volver acá
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- FINAL ---------- */
  if (pantalla === "final") {
    const aciertos = historial.filter((h) => h.bien).length;
    const cierre = aciertos === 5 ? "¡Cinco de cinco!" : aciertos >= 3 ? "¡Buen ojo!" : "Bienvenido al club";
    const bajada = aciertos === 5 ? "Reconocés a los vecinos que tenés hace veinte años."
      : aciertos >= 3 ? "Ya podés caminar el monte y nombrar lo que ves."
      : "Casi nadie los conoce. Por eso estamos acá.";
    return (
      <div className="pq">
        {estilos}
        {fondo}
        {aciertos >= 3 && <Confeti semilla="final" />}
        <div className="final">
          <span className="pildora">Se terminó el juego</span>
          <h1 className="titulo" style={{ fontSize: "clamp(34px,7vw,64px)", marginTop: 14 }}>{cierre}</h1>
          <p style={{ fontSize: 20, fontWeight: 800, margin: "8px 0 0" }}>{bajada}</p>
          <div className="podio">
            <div style={{ animationDelay: ".05s" }}><b>{puntajeAnimado}</b><span>de {PUNTAJE_MAXIMO} puntos</span></div>
            <div style={{ animationDelay: ".18s" }}><b>{aciertos}/5</b><span>árboles reconocidos</span></div>
            <div style={{ animationDelay: ".31s" }}><b>{mejorRacha}</b><span>mejor racha</span></div>
          </div>
          <ul className="repaso">
            {historial.map((h, i) => (
              <li key={h.clave} style={{ animationDelay: `${0.4 + i * 0.08}s` }}>
                <span style={{ fontSize: 22 }}>{h.bien ? "✅" : "❌"}</span>
                <span>{h.nombre}</span>
                {h.ganados > 0 && <span className="pts">+{h.ganados}</span>}
              </li>
            ))}
          </ul>
          <p className="cierreTexto">
            A principios del siglo XX Córdoba tenía 12 millones de hectáreas de bosque nativo: más del 70% de la
            provincia. Hoy se estima que queda alrededor del 3,6%. Llevate un plantín de nativa de la feria.
          </p>
          <button className="siguiente" style={{ maxWidth: 420, margin: "0 auto" }} onClick={empezar}>
            Otra partida
          </button>
        </div>
      </div>
    );
  }

  /* ---------- JUEGO ---------- */
  return (
    <div className="pq">
      {estilos}
      {fondo}
      {fase !== "pregunta" && acerto && <Confeti semilla={`r${ronda}`} />}

      <div className="lienzo">
        <header className="cab">
          <div className="num" key={`n${ronda}`}>{ronda + 1}</div>
          <div>
            <h1 className="titulo">Adiviná la <em>nativa cordobesa</em></h1>
            <span className="pildora">Ronda {ronda + 1} de 5 · {NIVELES[arbol.nivel - 1]}</span>
          </div>
          <div className="marcadores">
            <div className="marcador"><b>{puntajeAnimado}</b><span>Puntos</span></div>
            <div className="marcador">
              <b key={`rc${racha}`} className={racha > 0 ? "rachaViva" : undefined}>🔥 {racha}</b><span>Racha</span>
            </div>
            <div className="reloj-wrap" onClick={alternarReloj} title="Arrancar o pausar el reloj (T)">
              <Reloj restante={restante} corriendo={corriendo} />
            </div>
            <button className="iconoBtn" onClick={() => setMudo((v) => !v)} title="Sonido (M)">{mudo ? "🔇" : "🔊"}</button>
          </div>
        </header>

        <div className="pasos">
          {partida.map((a, i) => {
            const h = historial[i];
            return <span key={a.clave} className={`paso ${h ? (h.bien ? "ok" : "mal") : i === ronda ? "hoy" : ""}`} />;
          })}
        </div>

        <div className="tablero">
          <div>
            <div className={`tarjeta ${fase !== "pregunta" ? (acerto ? "bien" : "mal") : ""}`} key={`t${ronda}`}>
              {(() => {
                const i = intentoFoto[arbol.clave] ?? 0;
                if (i >= EXTENSIONES.length) return <Dibujo d={arbol.dibujo} />;
                return (
                  <img
                    className="foto"
                    src={`/arboles/${arbol.clave}.${EXTENSIONES[i]}`}
                    alt=""
                    onError={() => setIntentoFoto((t) => ({ ...t, [arbol.clave]: i + 1 }))}
                  />
                );
              })()}
              <p className="pieIlu">
                {fase === "pregunta"
                  ? ((intentoFoto[arbol.clave] ?? 0) >= EXTENSIONES.length ? "Ilustración de referencia" : "Foto de referencia")
                  : arbol.nombre}
              </p>
            </div>

            {fase === "pregunta" && (
              <>
                <button className="pistaBtn" onClick={() => { snd.click(); setVerPistas((v) => !v); }}>
                  {verPistas ? "Ocultar pistas" : "💡 Pistas para leer en voz alta"}
                </button>
                {verPistas && <ol className="pistas">{arbol.pistas.map((p) => <li key={p}>{p}</li>)}</ol>}
              </>
            )}
          </div>

          <div>
            {fase !== "ficha" ? (
              <>
                <h2 className="consigna">{CONSIGNAS[arbol.grupo]}</h2>
                <div className="opciones" key={`o${ronda}`}>
                  {arbol.opciones.map((op, i) => {
                    let clase = "opcion";
                    if (fase === "revelado") {
                      if (i === arbol.correcta) clase += " correcta";
                      else if (i === elegida) clase += " errada";
                      else clase += " apagada";
                    }
                    return (
                      <button key={op.clave} className={clase} disabled={fase !== "pregunta"}
                        onClick={() => resolver(i)} style={{ animationDelay: `${i * 0.07}s` }}>
                        <span className="tecla">{i + 1}</span>
                        <span className="comun">{op.comun}</span>
                        <span className="sci">{op.cientifico}</span>
                        {fase === "revelado" && i === arbol.correcta && <span className="marca">✓</span>}
                        {fase === "revelado" && i === elegida && i !== arbol.correcta && <span className="marca">✕</span>}
                      </button>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="ficha">
                <p className="veredicto">
                  {acerto ? (racha > 1 ? `¡Correcto! ${racha} al hilo 🔥` : "¡Correcto!") : elegida === -1 ? "Se acabó el tiempo" : "Casi…"}
                </p>
                <p className="nombreGrande">{arbol.nombre}</p>
                <p className="sciGrande">
                  {arbol.cientifico}
                  {arbol.ex && <span style={{ fontStyle: "normal", opacity: 0.75 }}> · {arbol.ex}</span>}
                  {arbol.alias && <span style={{ fontStyle: "normal", opacity: 0.75 }}> · también le dicen {arbol.alias}</span>}
                  <span style={{ fontStyle: "normal", opacity: 0.75 }}> · {arbol.familia}</span>
                </p>
                {[
                  { t: "Qué es", c: <p>{arbol.tipo}{arbol.altura ? `, ${arbol.altura}` : ""}.</p> },
                  arbol.magnitud
                    ? { t: `Magnitud ${arbol.magnitud}`, c: <p>{MAGNITUDES[arbol.magnitud]}</p> }
                    : { t: "Porte", c: <p>{arbol.porte}</p> },
                  { t: "Dónde vive", c: (
                      <div className="chips">
                        <span className="chip dom">{arbol.eco[0]}</span>
                        {arbol.eco.slice(1).map((e) => <span key={e} className="chip">{e}</span>)}
                      </div>
                    ) },
                  { t: "Por qué importa cuidarlo", c: <p>{arbol.conciencia}</p> },
                  { t: "Qué hace por tu huerta", c: <p>{arbol.huerta}</p> },
                ].map((f, i) => (
                  <div className="fila" key={f.t} style={{ animationDelay: `${i * 0.09}s` }}>
                    <h3>{f.t}</h3>{f.c}
                  </div>
                ))}
                <button className="siguiente" onClick={siguiente}>
                  {ronda === partida.length - 1 ? "Ver el resultado" : "Siguiente ronda"}
                </button>
                {acerto && (
                  <p className="ganancia">+{PUNTOS_BASE[ronda]} puntos{racha > 1 && ` · +${(racha - 1) * 5} por la racha`}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}