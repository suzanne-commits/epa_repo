import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { IndustryHome } from '@/components/views/IndustryHome'
import { ExploreDomainsView } from '@/components/views/ExploreDomainsView'
import { E2EView } from '@/components/views/E2EView'
import { RegulationsView } from '@/components/views/RegulationsView'
import { ProductLinesView } from '@/components/views/ProductLinesView'
import { L2DetailView } from '@/components/views/L2DetailView'
import { HowItWorksView } from '@/components/views/HowItWorksView'
import { StandardsView } from '@/components/views/StandardsView'
import { AdminView } from '@/components/views/AdminView'

export default function App() {
  return (
    <Routes>
      {/* Industry selector home */}
      <Route path="/" element={<IndustryHome />} />

      {/* Industry EPA views */}
      <Route path="/:industry" element={<Layout />}>
        <Route index element={<ExploreDomainsView />} />
        <Route path="e2e" element={<E2EView />} />
        <Route path="e2e/:e2eId" element={<E2EView />} />
        <Route path="regulations" element={<RegulationsView />} />
        <Route path="regulation/:regId" element={<RegulationsView />} />
        <Route path="products" element={<ProductLinesView />} />
        <Route path="product/:plId" element={<ProductLinesView />} />
        <Route path="l2/:l2Id" element={<L2DetailView />} />
        <Route path="how" element={<HowItWorksView />} />
        <Route path="standards" element={<StandardsView />} />
      </Route>

      {/* Client overlay views */}
      <Route path="/client/:clientId" element={<Layout />}>
        <Route index element={<ExploreDomainsView />} />
        <Route path="e2e" element={<E2EView />} />
        <Route path="regulations" element={<RegulationsView />} />
        <Route path="products" element={<ProductLinesView />} />
        <Route path="l2/:l2Id" element={<L2DetailView />} />
      </Route>

      {/* Admin / data maintenance */}
      <Route path="/admin" element={<AdminView />} />
      <Route path="/admin/*" element={<AdminView />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
