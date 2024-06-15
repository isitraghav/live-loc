<script>
  import { KonstaProvider } from "konsta/svelte";
  import { App, Page, View } from "framework7-svelte";
  import HomePage from "../pages/home.svelte";

  const f7params = {
    theme: "ios",
    dark: true,
    routes: [
      {
        path: "/",
        component: HomePage,
      },
    ],
  };
</script>

<!-- Wrap Framework7's App with KonstaProvider with theme="parent" -->
<KonstaProvider theme='ios' dark>
  <App {...f7params}>
    <View main url="/" />
  </App>
</KonstaProvider>
