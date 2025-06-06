<script>
  import eruda from "eruda";
  eruda.init();
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
<KonstaProvider theme="ios" dark>
  <div
    class="mx-auto h-screen max-w-[380px] border-1 border-black-200 shadow-lg overflow-hidden relative bg-gradient-to-b"
  >
    <App {...f7params}>
      <View main url="/" />
    </App>
  </div>
</KonstaProvider>
