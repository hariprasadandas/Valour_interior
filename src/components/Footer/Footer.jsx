const Footer = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-slate-200 bg-white/90">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 text-center text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
        <div>
          <p className="text-base font-semibold text-slate-800">
            Valour Interior
          </p>
          <p>Designing purposeful residential, hospitality, and workplace environments.</p>
        </div>
        <div className="space-y-1">
          <p className="font-medium text-slate-700">Studio</p>
          <p>Mumbai · Bengaluru · Goa</p>
          <a
            href="mailto:hello@valour.studio"
            className="font-semibold text-slate-900 hover:text-orange-500"
          >
            hello@valour.studio
          </a>
        </div>
        <p>© {year} Valour Interior. All rights reserved.</p>
      </div>
    </footer>
  )
}

export default Footer
