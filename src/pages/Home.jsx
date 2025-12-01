import { Link } from 'react-router-dom'
import PageShell from './PageShell.jsx'

const featuredProducts = [
  {
    name: 'Bespoke Walnut Wardrobe',
    sku: 'JL-WD-412',
    finish: 'Natural walnut + soft-close brass hardware',
    price: 245000,
    stock: 6,
    leadTime: '6 weeks',
  },
  {
    name: 'Aegean Quartz Kitchen',
    sku: 'KT-QZ-208',
    finish: 'Matte dove grey shutters, Calacatta countertop',
    price: 385000,
    stock: 3,
    leadTime: '8 weeks',
  },
  {
    name: 'Artisanal Terrazzo Dining Table',
    sku: 'DN-TR-305',
    finish: 'Hand-poured terrazzo + powder-coated steel legs',
    price: 148000,
    stock: 5,
    leadTime: '4 weeks',
  },
  {
    name: 'Acoustic Wall Panelling Kit',
    sku: 'AC-PN-110',
    finish: 'Ribbed oak veneer with integrated felt backing',
    price: 98000,
    stock: 18,
    leadTime: 'Ready',
  },
]

const Home = () => {
  return (
    <PageShell
      title="Interior Products Dashboard"
      description="Valour Interior Studio curates premium FF&E, bespoke joinery, and turnkey fit-outs tailored for residential and boutique commercial spaces across India."
    >
      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              About Valour Interior Studio
            </p>
            <p className="mt-4 text-base text-slate-700">
              We are a Hyderabad-based design and build collective delivering
              luxury interiors, modular kitchens, bespoke furniture, and acoustic
              solutions. From concept boards to site execution, our studio
              manages every milestone with in-house production, vetted artisan
              partners, and a strict QC checklist.
            </p>
            <p className="mt-3 text-sm text-slate-600">
              Core offerings include turnkey apartments, premium villas,
              boutique offices, hospitality lounges, and show-flat styling. Each
              quotation references live material costs, verified supplier
              timelines, and our post-handover maintenance program.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
              Store Snapshot
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Active SKUs</p>
                <p className="text-3xl font-semibold text-slate-900">240+</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Avg. Lead Time</p>
                <p className="text-3xl font-semibold text-slate-900">10 days</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Margin Guardrail</p>
                <p className="text-3xl font-semibold text-slate-900">32%</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              Keep product cards refreshed weekly so quotations reflect accurate
              costs and stock positions.
            </p>
            <Link
              to="/quotations"
              className="mt-6 inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-orange-600"
            >
              Create New Quotation
            </Link>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Featured Products
              </h2>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Pricing in INR
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm text-slate-600">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-3">Product</th>
                    <th className="pb-3">SKU</th>
                    <th className="pb-3">Finish</th>
                    <th className="pb-3 text-right">Unit Price</th>
                    <th className="pb-3 text-right">Stock</th>
                    <th className="pb-3 text-right">Lead Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {featuredProducts.map((product) => (
                    <tr key={product.sku}>
                      <td className="py-3 font-semibold text-slate-900">
                        {product.name}
                      </td>
                      <td className="py-3">{product.sku}</td>
                      <td className="py-3">{product.finish}</td>
                      <td className="py-3 text-right font-semibold text-slate-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 text-right">{product.stock} pcs</td>
                      <td className="py-3 text-right">{product.leadTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">
              Tip: Keep a short list of spotlight items handy for client
              conversations. Full catalogue lives in your product master sheet.
            </p>
          </div>
        </div>

        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Quotation Checklist
          </h2>
          <ul className="space-y-4 text-sm text-slate-700">
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-orange-500"></span>
              Confirm SKU availability + buffer inventory.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-orange-500"></span>
              Update finishing notes and installation timelines inside the
              quotation body.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-orange-500"></span>
              Apply agreed trade discount and double-check GST slabs.
            </li>
            <li className="flex gap-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-orange-500"></span>
              Export PDF and log the file name in your CRM before dispatching.
            </li>
          </ul>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Need to edit pricing in bulk? Update the master CSV once and refresh
            this dashboard. Quotation builder will pick up the latest data.
          </div>
        </div>
      </div>
    </PageShell>
  )
}

export default Home

