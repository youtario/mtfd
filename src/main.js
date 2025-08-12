import { createApp } from 'vue'
import App from './App.vue'
import 'leaflet/dist/leaflet.css'

// Correção para os ícones padrão do Leaflet
import { Icon } from 'leaflet'

// Caminhos corrigidos para os ícones (usando import.meta.url)
const iconRetinaUrl = new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href
const iconUrl = new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href
const shadowUrl = new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href

delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl
})

createApp(App).mount('#app')
