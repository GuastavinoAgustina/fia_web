import GranPrixDropdown from "@/components/gp-dropdown-list";

export default function Home() {
  return (
    <main className="p-10">
      <h1> Selecciones un Gran Premio</h1>

      <GranPrixDropdown label="Open List"/>
    </main>
  );
}
