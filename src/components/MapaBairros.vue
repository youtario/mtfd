<template>
  <div class="mapa-container">
    <l-map
      ref="map"
      style="height: 600px; width: 100%"
      :zoom="zoom"
      :center="center"
      :options="{ zoomControl: false }"
      @ready="onMapReady"
    >
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      />
      <l-geo-json
        v-if="geojson"
        :geojson="geojson"
        :options-style="estilo"
        :options-on-each-feature="adicionarTooltip"
      />
      <l-control-zoom position="topright" />
    </l-map>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { LMap, LTileLayer, LGeoJson, LControlZoom } from '@vue-leaflet/vue-leaflet'

// Configurações do mapa
const zoom = ref(12)
const center = ref([-26.3044, -48.8487])
const map = ref(null)
const geojson = ref(null)

// Estilo visual dos polígonos
const estilo = () => ({
  color: '#3388ff',
  fillColor: '#a2d2ff',
  fillOpacity: 0.4,
  weight: 1
})

// Adiciona tooltip com nome do bairro/área
const adicionarTooltip = (feature, layer) => {
  const nome = feature.properties.nome || feature.properties.NOME || feature.properties.name
  if (nome) {
    layer.bindTooltip(nome, {
      permanent: true,
      direction: 'center',
      className: 'tooltip-bairro'
    })
  }
}

// Callback quando o mapa está pronto
const onMapReady = async () => {
  console.log('Mapa está pronto')
  // Você pode adicionar lógicas adicionais aqui
}

// Carrega o arquivo GeoJSON
onMounted(async () => {
  try {
    const response = await fetch('/bairros.json')
    if (!response.ok) throw new Error('Falha ao carregar GeoJSON')
    geojson.value = await response.json()
    console.log('Dados GeoJSON carregados:', geojson.value)
  } catch (error) {
    console.error('Erro ao carregar GeoJSON:', error)
  }
})
</script>

<style>
.mapa-container {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.tooltip-bairro {
  font-size: 12px;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid #aaa;
  padding: 2px 6px;
  border-radius: 4px;
  color: #333;
}

/* Correção para ícones do Leaflet */
.leaflet-default-icon-path {
  background-image: url(https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png);
}
</style>
