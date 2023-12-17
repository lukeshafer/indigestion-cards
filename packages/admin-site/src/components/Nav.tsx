import { A } from "@solidjs/router";

export default function Nav() {
  return (
    <header>
r     <nav>
        <A href="/admin-users">Admin Users</A>
        <A href="/card-designs">Card Designs</A>
        <A href="/pack-types">Pack Types</A>
        <A href="/packs">Packs</A>
        <A href="/rarities">Rarities</A>
        <A href="/seasons">Seasons</A>
        <A href="/site-config">Site Config</A>
        <A href="/users">Users</A>
      </nav>
    </header>
  );
}
