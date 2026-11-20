# NEXTECH

A bilingual Arabic/English technology storefront built with HTML, CSS, and JavaScript.

## Features

- 64-product catalog with category and text filtering
- English and Arabic interface with RTL support
- Persistent cart with quantities and removal
- Newsletter and contact form feedback
- Responsive desktop, tablet, and mobile layout
- Product and hero image fallbacks
- Locally stored, real product photography for the product catalog

## Run locally

```powershell
python -m http.server 5500
```

Visit `http://localhost:5500`.

The cart and forms are front-end demonstrations. Connect them to real APIs before production use.
Each product has a distinct, locally stored photo named `images/products/product-<id>.jpg`; Commons attribution and license details are in `images/products/credits.json`.

### Accessory photo credits

The last ten accessory photos are individually matched to their product descriptions:

- Charger: [Raimond Spekking](https://commons.wikimedia.org/wiki/File:USB_power_adapter_for_Apple_iPod,_Model_A1205,_by_Foxlink_Technology_Ltd-1048.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Wireless dock: [WrS.tm.pl](https://commons.wikimedia.org/wiki/File:Wireless_power_transfer_from_inductive_charging_pad_to_Deutsche_Telekom_T_Phone_Pro_5G.ogv), public domain.
- Power bank: [Ilya Plekhanov](https://commons.wikimedia.org/wiki/File:Power_bank.JPG), [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/).
- USB hub: [David Leo Veksler](https://commons.wikimedia.org/wiki/File:Various_USB-C_hubs_and_adapters_with_MacBook_Pro_(26550311179).jpg), [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/).
- SSD: [Tony Webster](https://commons.wikimedia.org/wiki/File:Samsung_T5_Portable_External_SSD_(Solid_State_Drive)_(43544308485).jpg), [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).
- Speaker: [Beats](https://commons.wikimedia.org/wiki/File:Beats_By_Dr._Dre_Pill_Portable_Bluetooth_Speaker_Black_N2.jpg), CC0.
- Travel backpack: [Pixel.la Free Stock Photos](https://commons.wikimedia.org/wiki/File:Clothes-travel-voyage-backpack_(24324553095).jpg), CC0.
- Laptop stand: [Richardinsky](https://commons.wikimedia.org/wiki/File:Cozistyle_Stand_Sleeve.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Charging pad: [Seawhelan](https://commons.wikimedia.org/wiki/File:Wireless_Charging_Pad.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- Docking station: [D-Kuru](https://commons.wikimedia.org/wiki/File:Delock_USB_m.2_NVMe_docking_station-oblique_FS_PNr%C2%B00912.jpg), [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
