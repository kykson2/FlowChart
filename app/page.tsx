import FlowTable from './components/FlowTable';

export default function Home() {
  return (
    <main className="min-h-screen p-4 bg-white">
      <h1 className="text-3xl font-bold mb-8">플로우차트 테이블</h1>
      <FlowTable />
    </main>
  );
}
