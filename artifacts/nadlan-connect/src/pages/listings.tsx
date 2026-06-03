import { useState } from "react";
import { useListListings } from "@workspace/api-client-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

const ALL = "__all__";

export default function Listings() {
  const [ville, setVille] = useState<string>(ALL);
  const [type, setType] = useState<string>(ALL);

  const { data, isLoading } = useListListings({
    ville: ville === ALL ? undefined : ville,
    type: type === ALL ? undefined : type,
  });

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="font-serif text-4xl font-bold text-primary mb-2">Propriétés</h1>
          <p className="text-muted-foreground">Trouvez votre prochain investissement parmi notre sélection premium.</p>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="space-y-2 flex-1 w-full">
          <label className="text-sm font-medium">Ville</label>
          <Select value={ville} onValueChange={setVille}>
            <SelectTrigger>
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les villes</SelectItem>
              <SelectItem value="tlv">Tel Aviv</SelectItem>
              <SelectItem value="jer">Jérusalem</SelectItem>
              <SelectItem value="hfa">Haïfa</SelectItem>
              <SelectItem value="bs">Beer-Sheva</SelectItem>
              <SelectItem value="nat">Netanya</SelectItem>
              <SelectItem value="ash">Ashdod</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1 w-full">
          <label className="text-sm font-medium">Type de bien</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder="Tous types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous types</SelectItem>
              <SelectItem value="resale">Revente</SelectItem>
              <SelectItem value="new_development">Neuf</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button className="w-full md:w-auto h-10 px-8 gap-2">
          <Filter className="h-4 w-4" /> Filtrer
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[400px] bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : data?.listings.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
          <h3 className="text-xl font-medium mb-2">Aucun bien trouvé</h3>
          <p className="text-muted-foreground">Modifiez vos filtres pour voir plus de résultats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
