export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-label="Carregando conteúdo">
      <div className="h-8 w-52 rounded-lg bg-[#f4d7da]" />
      <div className="mt-3 h-4 w-full max-w-xl rounded bg-[#f4d7da]" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="ui-card h-36" />
        ))}
      </div>
      <div className="ui-card mt-6 h-72" />
    </div>
  );
}
