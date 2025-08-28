<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-content">
        <!-- Título -->
        <h1 class="sidebar-title">Mapa de Pontos de Doação</h1>

        <!-- Tipo de Doação -->
        <div class="filter-group">
          <h3 class="filter-label">Tipo de Doação</h3>
          <div class="checkbox-list">
            <label class="checkbox-item">
              <input type="checkbox" v-model="filtros.roupas" @change="aplicarFiltros">
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Roupas</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="filtros.alimentos" @change="aplicarFiltros">
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Alimentos</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="filtros.brinquedos" @change="aplicarFiltros">
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Brinquedos</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="filtros.livros" @change="aplicarFiltros">
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Livros</span>
            </label>
          </div>
        </div>

        <!-- Regiões -->
        <div class="filter-group">
          <h3 class="filter-label">REGIÕES</h3>
          <div class="checkbox-list">
            <label class="checkbox-item">
              <input type="checkbox" v-model="filtros.norte" @change="aplicarFiltros">
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Região Norte</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="filtros.sul" @change="aplicarFiltros">
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Região Sul</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="filtros.centro" @change="aplicarFiltros">
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Centro</span>
            </label>
            <label class="checkbox-item">
              <input type="checkbox" v-model="filtros.leste" @change="aplicarFiltros">
              <span class="checkbox-custom"></span>
              <span class="checkbox-text">Região Leste</span>
            </label>
          </div>
        </div>

        <!-- Distância -->
        <div class="filter-group">
          <h3 class="filter-label">Distância</h3>
          <select v-model="filtros.distancia" @change="aplicarFiltros" class="distance-select">
            <option value="">Até 3km</option>
            <option value="5">Até 5km</option>
            <option value="10">Até 10km</option>
            <option value="20">Até 20km</option>
          </select>
        </div>

        <!-- Botão Aplicar Filtro -->
        <button class="apply-button" @click="aplicarFiltros">
          Aplicar Filtro
        </button>
      </div>
    </aside>

    <!-- Map Area -->
    <main class="map-area">
      <!-- Search Bar -->
      <div class="search-wrapper">
        <div class="search-container">
          <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="21 21l-4.35-4.35"/>
          </svg>
          <input
            v-model="termoPesquisa"
            type="text"
            placeholder="Ponto de Doação"
            class="search-input"
            @input="pesquisarBairro"
          >
        </div>
      </div>

      <!-- Leaflet Map -->
      <div class="map-container">
        <l-map
          ref="map"
          style="height: 100%; width: 100%"
          :zoom="zoom"
          :center="center"
          :options="{ zoomControl: false }"
          @ready="onMapReady"
        >
          <!-- Tile Layer -->
          <l-tile-layer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
          />

          <!-- GeoJSON Bairros -->
          <l-geo-json
            v-if="geojson"
            :geojson="geojson"
            :options-style="obterEstiloBairro"
            :options-on-each-feature="adicionarTooltipEEventos"
          />

          <!-- Marcadores de Pontos -->
          <l-marker
            v-for="ponto in pontosFiltrados"
            :key="ponto.id"
            :lat-lng="ponto.coordenadas"
            @click="selecionarPonto(ponto)"
          >
            <l-icon
              :icon-size="[32, 32]"
              :icon-anchor="[16, 16]"
              class-name="custom-marker"
            >
              <div class="marker-pin" :class="ponto.tipo">
                <div class="marker-dot"></div>
              </div>
            </l-icon>

            <l-popup>
              <div class="popup-content">
                <h4>{{ ponto.nome }}</h4>
                <div class="popup-info">
                  <p><strong>Categoria:</strong> {{ ponto.categoria }}</p>
                  <p><strong>📍 Endereço:</strong> {{ ponto.endereco }}</p>
                  <p><strong>🕒 Horário:</strong> {{ ponto.horario }}</p>
                  <p v-if="ponto.telefone"><strong>📞 Telefone:</strong> {{ ponto.telefone }}</p>
                </div>
                <button
                  class="route-button"
                  @click="abrirRota(ponto.coordenadas)"
                >
                  🗺️ Como Chegar
                </button>
              </div>
            </l-popup>
          </l-marker>

          <!-- Zoom Controls -->
          <l-control-zoom position="bottomright" />
        </l-map>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { LMap, LTileLayer, LGeoJson, LControlZoom, LMarker, LIcon, LPopup } from '@vue-leaflet/vue-leaflet'

// Configurações do mapa
const zoom = ref(12)
const center = ref([-26.3044, -48.8487])
const map = ref(null)
const geojson = ref(null)
const termoPesquisa = ref('')

// Filtros
const filtros = ref({
  roupas: false,
  alimentos: false,
  brinquedos: false,
  livros: false,
  norte: false,
  sul: false,
  centro: false,
  leste: false,
  distancia: ''
})

// Pontos de doação - ADICIONE SEUS DADOS REAIS AQUI
const pontosDoacao = ref([
  {
    id: 1,
    nome: 'Centro Comunitário Boa Vista',
    categoria: 'Roupas e Alimentos',
    tipo: 'roupas',
    endereco: 'Rua das Flores, 123 - Boa Vista',
    horario: '8:00 - 17:00',
    telefone: '(47) 3422-1234',
    coordenadas: [-26.3044, -48.8487],
    regiao: 'centro'
  },
  {
    id: 2,
    nome: 'Igreja São José',
    categoria: 'Alimentos',
    tipo: 'alimentos',
    endereco: 'Av. Brasil, 456 - Bucarein',
    horario: '9:00 - 18:00',
    telefone: '(47) 3433-5678',
    coordenadas: [-26.2944, -48.8587],
    regiao: 'norte'
  },
  {
    id: 3,
    nome: 'Creche Municipal Alegria',
    categoria: 'Brinquedos',
    tipo: 'brinquedos',
    endereco: 'Rua da Paz, 789 - Glória',
    horario: '7:00 - 19:00',
    telefone: '(47) 3444-9999',
    coordenadas: [-26.3144, -48.8387],
    regiao: 'sul'
  },
  {
    id: 4,
    nome: 'Biblioteca Pública',
    categoria: 'Livros',
    tipo: 'livros',
    endereco: 'Rua XV de Novembro, 321 - Centro',
    horario: '8:00 - 20:00',
    telefone: '(47) 3455-1111',
    coordenadas: [-26.3000, -48.8450],
    regiao: 'centro'
  }
])

// Pontos filtrados
const pontosFiltrados = computed(() => {
  return pontosDoacao.value.filter(ponto => {
    // Filtro por tipo
    const tipoSelecionado = filtros.value.roupas || filtros.value.alimentos ||
                           filtros.value.brinquedos || filtros.value.livros

    if (tipoSelecionado) {
      const tipoMatch =
        (filtros.value.roupas && ponto.tipo === 'roupas') ||
        (filtros.value.alimentos && ponto.tipo === 'alimentos') ||
        (filtros.value.brinquedos && ponto.tipo === 'brinquedos') ||
        (filtros.value.livros && ponto.tipo === 'livros')

      if (!tipoMatch) return false
    }

    // Filtro por região
    const regiaoSelecionada = filtros.value.norte || filtros.value.sul ||
                             filtros.value.centro || filtros.value.leste

    if (regiaoSelecionada) {
      const regiaoMatch =
        (filtros.value.norte && ponto.regiao === 'norte') ||
        (filtros.value.sul && ponto.regiao === 'sul') ||
        (filtros.value.centro && ponto.regiao === 'centro') ||
        (filtros.value.leste && ponto.regiao === 'leste')

      if (!regiaoMatch) return false
    }

    // Filtro por busca
    if (termoPesquisa.value) {
      const termo = termoPesquisa.value.toLowerCase()
      return ponto.nome.toLowerCase().includes(termo) ||
             ponto.categoria.toLowerCase().includes(termo) ||
             ponto.endereco.toLowerCase().includes(termo)
    }

    return true
  })
})

// Estilo dos bairros (background sutil)
const obterEstiloBairro = () => ({
  color: '#cbd5e0',
  fillColor: '#f7fafc',
  fillOpacity: 0.2,
  weight: 1
})

// Adicionar tooltips aos bairros
const adicionarTooltipEEventos = (feature, layer) => {
  const nome = feature.properties.nome || feature.properties.NOME || feature.properties.name

  if (nome) {
    layer.bindTooltip(nome, {
      permanent: false,
      direction: 'center',
      className: 'bairro-tooltip'
    })
  }
}

// Aplicar filtros
const aplicarFiltros = () => {
  console.log('Filtros aplicados:', filtros.value)
}

// Pesquisar
const pesquisarBairro = () => {
  // A pesquisa é reativa através do computed property
}

// Selecionar ponto
const selecionarPonto = (ponto) => {
  console.log('Ponto selecionado:', ponto)
}

// Abrir rota no Google Maps
const abrirRota = (coordenadas) => {
  const [lat, lng] = coordenadas
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  window.open(url, '_blank')
}

// Callback do mapa
const onMapReady = () => {
  console.log('Mapa pronto')
}

// Carregar GeoJSON
onMounted(async () => {
  try {
    const response = await fetch('/bairros.json')
    if (!response.ok) throw new Error('Falha ao carregar GeoJSON')
    geojson.value = await response.json()
    console.log('Dados GeoJSON carregados')
  } catch (error) {
    console.error('Erro ao carregar GeoJSON:', error)
  }
})
</script>

<style>
/* Reset e Base */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: #2d3748;
  background: #f8fafc;
  height: 100vh;
  overflow: hidden;
}

/* Layout Principal */
.app-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
}

/* Sidebar */
.sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 4px rgba(0,0,0,0.02);
}

.sidebar-content {
  padding: 24px;
  flex: 1;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 32px;
  line-height: 1.3;
}

/* Grupos de Filtro */
.filter-group {
  margin-bottom: 28px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
}

/* Lista de Checkboxes */
.checkbox-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-item {
  display: flex;
  align-items: center;
  cursor: pointer;
  position: relative;
  font-size: 14px;
  color: #4a5568;
  transition: color 0.2s ease;
}

.checkbox-item:hover {
  color: #2d3748;
}

.checkbox-item input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  cursor: pointer;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 2px solid #cbd5e0;
  border-radius: 3px;
  margin-right: 10px;
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-item input[type="checkbox"]:checked + .checkbox-custom {
  background: #3182ce;
  border-color: #3182ce;
}

.checkbox-item input[type="checkbox"]:checked + .checkbox-custom::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.checkbox-text {
  user-select: none;
  line-height: 1.4;
}

/* Select de Distância */
.distance-select {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 14px;
  color: #4a5568;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.distance-select:focus {
  outline: none;
  border-color: #3182ce;
}

/* Botão Aplicar */
.apply-button {
  width: 100%;
  background: #3182ce;
  color: white;
  border: none;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 16px;
}

.apply-button:hover {
  background: #2c5aa0;
  transform: translateY(-1px);
}

.apply-button:active {
  transform: translateY(0);
}

/* Área do Mapa */
.map-area {
  flex: 1;
  position: relative;
  background: #f8fafc;
}

/* Barra de Pesquisa */
.search-wrapper {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1000;
}

.search-container {
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  min-width: 280px;
}

.search-icon {
  color: #a0aec0;
  margin-right: 8px;
  flex-shrink: 0;
}

.search-input {
  border: none;
  outline: none;
  flex: 1;
  font-size: 14px;
  color: #2d3748;
  background: transparent;
}

.search-input::placeholder {
  color: #a0aec0;
}

/* Container do Mapa */
.map-container {
  height: 100vh;
  width: 100%;
}

/* Marcadores Customizados */
.marker-pin {
  width: 32px;
  height: 32px;
  border-radius: 50% 50% 50% 0;
  position: relative;
  transform: rotate(-45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
  transition: all 0.2s ease;
}

.marker-pin:hover {
  transform: rotate(-45deg) scale(1.1);
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: white;
}

/* Cores dos Marcadores */
.marker-pin.roupas {
  background: linear-gradient(135deg, #e53e3e, #c53030);
}

.marker-pin.alimentos {
  background: linear-gradient(135deg, #38a169, #2f855a);
}

.marker-pin.brinquedos {
  background: linear-gradient(135deg, #d53f8c, #b83280);
}

.marker-pin.livros {
  background: linear-gradient(135deg, #3182ce, #2c5aa0);
}

/* Popup */
.popup-content {
  min-width: 280px;
  padding: 4px;
}

.popup-content h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.popup-info {
  margin-bottom: 16px;
}

.popup-info p {
  margin-bottom: 8px;
  font-size: 13px;
  color: #4a5568;
  line-height: 1.4;
}

.route-button {
  width: 100%;
  background: #3182ce;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.route-button:hover {
  background: #2c5aa0;
  transform: translateY(-1px);
}

/* Tooltip dos Bairros */
.bairro-tooltip {
  background: rgba(45, 55, 72, 0.9);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
}

/* Controles do Leaflet */
.leaflet-control-zoom {
  border: none !important;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
}

.leaflet-control-zoom a {
  background: white !important;
  color: #4a5568 !important;
  border: 1px solid #e2e8f0 !important;
  width: 36px !important;
  height: 36px !important;
  line-height: 34px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
}

.leaflet-control-zoom a:hover {
  background: #f7fafc !important;
  color: #2d3748 !important;
}

/* Responsivo */
@media (max-width: 768px) {
  .app-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    height: auto;
    max-height: 50vh;
    overflow-y: auto;
  }

  .sidebar-content {
    padding: 16px;
  }

  .sidebar-title {
    font-size: 16px;
    margin-bottom: 20px;
  }

  .filter-group {
    margin-bottom: 20px;
  }

  .map-container {
    height: 50vh;
  }

  .search-wrapper {
    top: 10px;
    right: 10px;
    left: 10px;
  }

  .search-container {
    min-width: auto;
    width: 100%;
  }
}

@media (max-width: 480px) {
  .sidebar-content {
    padding: 12px;
  }

  .checkbox-list {
    gap: 8px;
  }

  .popup-content {
    min-width: 240px;
  }
}</style>
