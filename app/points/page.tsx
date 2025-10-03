import GranPrixDropdown from "@/components/gp-dropdown-list";
import { createClient } from "@supabase/supabase-js";


const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!)


export default async function Home() {
  const { data, error } = await supabase
  .from('Carrera')
  .select('lugar')
  
  
  const listaGP = data!.map(it => it.lugar) 

  console.log(listaGP)
  return (
    <main className="p-10">
      <h1> Selecciones un Gran Premio</h1>

      <GranPrixDropdown label="Open List" listaGP={listaGP}/>
    </main>
  );
}
