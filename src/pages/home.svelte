<script>
  import "framework7-icons";
  import { Page } from "framework7-svelte";
  import {
    Block,
    BlockHeader,
    Button,
    Link,
    List,
    ListInput,
    Navbar,
  } from "konsta/svelte";
  import "leaflet/dist/leaflet.css";
  import L from "leaflet";
  import "leaflet-routing-machine";
  import { onMount } from "svelte";
  import { Geolocation } from "@capacitor/geolocation";

  let map;
  let loading = false;

  var LeafIcon = L.Icon.extend({
    options: {
      iconSize: [32, 32],
    },
  });

  var greenIcon = new LeafIcon({
    iconUrl: "https://img.icons8.com/skeuomorphism/32/marker.png",
  });

  onMount(() => {
    map = L.map("map").setView([51.505, -0.09], 13);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
  });

  async function loadlocation() {
    loading = true;
    try {
      const res = await Geolocation.getCurrentPosition();
      console.log(res);
      let c = res.coords;
      let coords = [c.latitude, c.longitude];
      locationuser = coords;
      L.marker(coords, { icon: greenIcon }).addTo(map);
      map.setView(coords, 18);
    } catch (error) {
      console.error("Error getting location:", error);
      // Fallback to browser geolocation
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            let coords = [position.coords.latitude, position.coords.longitude];
            locationuser = coords;
            L.marker(coords, { icon: greenIcon }).addTo(map);
            map.setView(coords, 18);
          },
          (err) => console.error("Fallback geolocation error:", err),
          { enableHighAccuracy: true }
        );
      }
    } finally {
      loading = false;
    }
  }

  let locationuser;
  Geolocation.checkPermissions().then((res) => {
    if (res.location == "granted") {
      loadlocation();
    }
  });

  import GUN from "gun";
  import "gun/lib/radisk2";
  const db = GUN({
    localStorage: true,
    radisk: true,
    peers: [
      "https://peer.wallie.io/gun",
      "https://gun-manhattan.herokuapp.com/gun",
    ],
  });

  let livelocid;
  let otherusermarker;
  function trackID() {
    console.log(livelocid);
    db.get("liveloc")
      .get(livelocid)
      .once(async (res) => {
        console.log(res);
        if (res) {
          db.get("liveloc")
            .get(livelocid)
            .on((res) => {
              if (res == false) {
                console.log("removed loc");
                map.removeControl(otherusermarker);
              } else {
                console.log("updated");
              }
            });
          otherusermarker = L.Routing.control({
            waypoints: [locationuser, JSON.parse(res)],
            routeWhileDragging: false,
          }).addTo(map);

          await Geolocation.watchPosition(
            { enableHighAccuracy: true },
            (res) => {
              if (res) {
                db.get("liveloc")
                  .get(`${livelocid}reply`)
                  .put(
                    JSON.stringify([res.coords.latitude, res.coords.longitude])
                  );
              }
            }
          );
        }
      });
  }

  import { customAlphabet } from "nanoid";
  import copy from "copy-to-clipboard";

  const nanoid = customAlphabet("1234567890abcdef", 5);

  let sharedlocation = false;
  let sharedlocid, someonewatching;
  let watchlocation;
  let sharedusermarker;
  async function shareloc() {
    loading = true;
    try {
      const res = await Geolocation.getCurrentPosition();
      console.log(res);
      let c = res.coords;
      let coords = [c.latitude, c.longitude];

      let liveid = nanoid();
      copy(liveid);

      db.get("liveloc")
        .get(liveid)
        .put(JSON.stringify(coords), (ack) => {
          if (!ack.err) {
            console.log(liveid);
            sharedlocation = true;
            sharedlocid = liveid;
          }
        });

      watchlocation = await Geolocation.watchPosition(
        { enableHighAccuracy: true },
        (res) => {
          if (res) {
            c = res.coords;
            coords = [c.latitude, c.longitude];

            console.log("location uploaded");
            db.get("liveloc")
              .get(liveid)
              .put(JSON.stringify(coords), (ack) => {
                if (!ack.err) {
                  console.log(liveid);
                  sharedlocation = true;
                  sharedlocid = liveid;

                  db.get("liveloc")
                    .get(`${liveid}reply`)
                    .on((res) => {
                      if (res) {
                        someonewatching = true;
                        sharedlocation = false;
                        if (sharedusermarker) {
                          map.removeControl(sharedusermarker);
                        }
                        sharedusermarker = L.Routing.control({
                          waypoints: [locationuser, JSON.parse(res)],
                          routeWhileDragging: false,
                        }).addTo(map);
                        console.log("someone watching");
                      }
                    });
                }
              });
          }
        }
      );
    } catch (error) {
      console.error("Error sharing location:", error);
      shareloc();
    } finally {
      loading = false;
    }
  }

  async function stopsharing() {
    await Geolocation.clearWatch({ id: watchlocation })
      .then((res) => {
        db.get("liveloc")
          .get(sharedlocid)
          .put(false, (ack) => {
            console.log("stopped sharing");
            someonewatching = false;
            map.removeControl(sharedusermarker);
          });
      })
      .catch((er) => {
        console.log(er);
      });
  }

  db.get("liveloc").on((res) => {
    console.log(res);
  });
</script>

<Page>
  <Navbar
    title="live-loc"
    subtitle="share accurate location quickly"
    class="top-0 sticky"
  ></Navbar>

  <div id="map" style="height: 400px;"></div>

  <div class="m-3">
    {#if loading}
      <div>Loading...</div>
    {:else if sharedlocation}
      <div>
        waiting for someone to put your id ( {sharedlocid} ) to set destination...
      </div>
    {:else if someonewatching}
      <div>someone can now see your location :D</div>
      <Button onClick={stopsharing}>STOP SHARING</Button>
    {:else}
      <div>
        <List strongIos insetIos>
          <div class="flex gap-1">
            <ListInput
              onInput={(res) => {
                livelocid = res.srcElement.value;
              }}
              onChange={() => {
                trackID();
                trackID();
              }}
              type="text"
              placeholder="Enter liv-loc ID"
            />
          </div>
          <div class="text-center uppercase m-2">or</div>
          <div class="flex gap-1">
            <div class="w-full">
              <Button onClick={shareloc} tonal>Share Your Location</Button>
            </div>
            <div class="ml-auto">
              <Button tonal onClick={loadlocation}>
                <i class="f7-icons" style="font-size: 16px;">location</i>
              </Button>
            </div>
          </div>
        </List>
      </div>
    {/if}
  </div>
</Page>
