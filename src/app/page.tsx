import { CommandCenter } from "@/components/command-center";
import { listDashboardData } from "@/lib/storage";

export default function Home() {
  const data = listDashboardData();

  return <CommandCenter initialData={data} />;
}
