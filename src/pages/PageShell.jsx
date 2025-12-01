const PageShell = ({ title, description, children }) => {
  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl bg-white/95 p-8 shadow-2xl ring-1 ring-slate-100">
      <header className="space-y-2 border-b border-slate-100 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-500">
          Valour Interior
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">{title}</h1>
        {description ? (
          <p className="text-lg text-slate-600">{description}</p>
        ) : null}
      </header>
      <div className="pt-6 text-slate-600">{children}</div>
    </section>
  )
}

export default PageShell

