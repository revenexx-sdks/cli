import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const avatars = new Command("avatars")
  .description(
    commandDescriptions["avatars"] ??
      `Generated images: initials, QR codes, country flags, browser and credit-card icons. Every operation answers image bytes, not JSON.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const getBrowserSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Browser Code.", type: "string", required: true, enum: ["aa","an","ch","ci","cm","cr","ff","sf","mf","ps","oi","om","op","on"] },
  { key: "width", option: "--width <width>", name: "width", description: "Image width. Pass an integer between 0 to 2000. Defaults to 100.", type: "integer", required: false },
  { key: "height", option: "--height <height>", name: "height", description: "Image height. Pass an integer between 0 to 2000. Defaults to 100.", type: "integer", required: false },
  { key: "quality", option: "--quality <quality>", name: "quality", description: "Image quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.", type: "integer", required: false },
];
avatars
  .command(`get-browser`)
  .description(`You can use this endpoint to show different browser icons to your users. The code argument receives the browser code as it appears in your user [GET /account/sessions](https://app.revenexx.com/docs/references/cloud/client-web/account#getSessions) endpoint. Use width, height and quality arguments to change the output settings.

When one dimension is specified and the other is 0, the image is scaled with preserved aspect ratio. If both dimensions are 0, the API provides an image at source quality. If dimensions are not specified, the default size of image returned is 100x100px.`)
  .option(`--code <code>`, `Browser Code.`)
  .option(`--width <width>`, `Image width. Pass an integer between 0 to 2000. Defaults to 100.`, parseInteger)
  .option(`--height <height>`, `Image height. Pass an integer between 0 to 2000. Defaults to 100.`, parseInteger)
  .option(`--quality <quality>`, `Image quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, width, height, quality } = await promptForMissing(
          _options,
          getBrowserSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/avatars/browsers/{code}`.replace(`{code}`, code);
        const _payload: RequestParams = {};
        if (width !== undefined) {
          _payload[`width`] = width;
        }
        if (height !== undefined) {
          _payload[`height`] = height;
        }
        if (quality !== undefined) {
          _payload[`quality`] = quality;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(avatars.commands.at(-1)!, getBrowserSpecs, { method: "get" });
const getCreditCardSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Credit Card Code. Possible values: amex, argencard, cabal, cencosud, diners, discover, elo, hipercard, jcb, mastercard, naranja, targeta-shopping, unionpay, visa, mir, maestro, rupay.", type: "string", required: true, enum: ["amex","argencard","cabal","cencosud","diners","discover","elo","hipercard","jcb","mastercard","naranja","targeta-shopping","unionpay","visa","mir","maestro","rupay"] },
  { key: "width", option: "--width <width>", name: "width", description: "Image width. Pass an integer between 0 to 2000. Defaults to 100.", type: "integer", required: false },
  { key: "height", option: "--height <height>", name: "height", description: "Image height. Pass an integer between 0 to 2000. Defaults to 100.", type: "integer", required: false },
  { key: "quality", option: "--quality <quality>", name: "quality", description: "Image quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.", type: "integer", required: false },
];
avatars
  .command(`get-credit-card`)
  .description(`The credit card endpoint will return you the icon of the credit card provider you need. Use width, height and quality arguments to change the output settings.

When one dimension is specified and the other is 0, the image is scaled with preserved aspect ratio. If both dimensions are 0, the API provides an image at source quality. If dimensions are not specified, the default size of image returned is 100x100px.`)
  .option(`--code <code>`, `Credit Card Code. Possible values: amex, argencard, cabal, cencosud, diners, discover, elo, hipercard, jcb, mastercard, naranja, targeta-shopping, unionpay, visa, mir, maestro, rupay.`)
  .option(`--width <width>`, `Image width. Pass an integer between 0 to 2000. Defaults to 100.`, parseInteger)
  .option(`--height <height>`, `Image height. Pass an integer between 0 to 2000. Defaults to 100.`, parseInteger)
  .option(`--quality <quality>`, `Image quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, width, height, quality } = await promptForMissing(
          _options,
          getCreditCardSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/avatars/credit-cards/{code}`.replace(`{code}`, code);
        const _payload: RequestParams = {};
        if (width !== undefined) {
          _payload[`width`] = width;
        }
        if (height !== undefined) {
          _payload[`height`] = height;
        }
        if (quality !== undefined) {
          _payload[`quality`] = quality;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(avatars.commands.at(-1)!, getCreditCardSpecs, { method: "get" });
const getFlagSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Country Code. ISO Alpha-2 country code format.", type: "string", required: true, enum: ["af","ao","al","ad","ae","ar","am","ag","au","at","az","bi","be","bj","bf","bd","bg","bh","bs","ba","by","bz","bo","br","bb","bn","bt","bw","cf","ca","ch","cl","cn","ci","cm","cd","cg","co","km","cv","cr","cu","cy","cz","de","dj","dm","dk","do","dz","ec","eg","er","es","ee","et","fi","fj","fr","fm","ga","gb","ge","gh","gn","gm","gw","gq","gr","gd","gt","gy","hn","hr","ht","hu","id","in","ie","ir","iq","is","il","it","jm","jo","jp","kz","ke","kg","kh","ki","kn","kr","kw","la","lb","lr","ly","lc","li","lk","ls","lt","lu","lv","ma","mc","md","mg","mv","mx","mh","mk","ml","mt","mm","me","mn","mz","mr","mu","mw","my","na","ne","ng","ni","nl","no","np","nr","nz","om","pk","pa","pe","ph","pw","pg","pl","pf","kp","pt","py","qa","ro","ru","rw","sa","sd","sn","sg","sb","sl","sv","sm","so","rs","ss","st","sr","sk","si","se","sz","sc","sy","td","tg","th","tj","tm","tl","to","tt","tn","tr","tv","tz","ug","ua","uy","us","uz","va","vc","ve","vn","vu","ws","ye","za","zm","zw"] },
  { key: "width", option: "--width <width>", name: "width", description: "Image width. Pass an integer between 0 to 2000. Defaults to 100.", type: "integer", required: false },
  { key: "height", option: "--height <height>", name: "height", description: "Image height. Pass an integer between 0 to 2000. Defaults to 100.", type: "integer", required: false },
  { key: "quality", option: "--quality <quality>", name: "quality", description: "Image quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.", type: "integer", required: false },
];
avatars
  .command(`get-flag`)
  .description(`You can use this endpoint to show different country flags icons to your users. The code argument receives the 2 letter country code. Use width, height and quality arguments to change the output settings. Country codes follow the [ISO 3166-1](https://en.wikipedia.org/wiki/ISO_3166-1) standard.

When one dimension is specified and the other is 0, the image is scaled with preserved aspect ratio. If both dimensions are 0, the API provides an image at source quality. If dimensions are not specified, the default size of image returned is 100x100px.`)
  .option(`--code <code>`, `Country Code. ISO Alpha-2 country code format.`)
  .option(`--width <width>`, `Image width. Pass an integer between 0 to 2000. Defaults to 100.`, parseInteger)
  .option(`--height <height>`, `Image height. Pass an integer between 0 to 2000. Defaults to 100.`, parseInteger)
  .option(`--quality <quality>`, `Image quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, width, height, quality } = await promptForMissing(
          _options,
          getFlagSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/avatars/flags/{code}`.replace(`{code}`, code);
        const _payload: RequestParams = {};
        if (width !== undefined) {
          _payload[`width`] = width;
        }
        if (height !== undefined) {
          _payload[`height`] = height;
        }
        if (quality !== undefined) {
          _payload[`quality`] = quality;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(avatars.commands.at(-1)!, getFlagSpecs, { method: "get" });
const getImageSpecs: PromptSpec[] = [
  { key: "url", option: "--url <url>", name: "url", description: "Image URL which you want to crop. Must be publicly reachable and answer 200 with a raster image on the first request: the fetch does not follow redirects, so a URL that 301s answers 404, as does any URL whose response is not 200. The bytes are decoded by Imagick — an SVG (including most `favicon.ico` files, which are SVG in disguise) and a genuine `.ico` both fail to decode and answer 500.", type: "string", required: true },
  { key: "width", option: "--width <width>", name: "width", description: "Resize preview image width, Pass an integer between 0 to 2000. Defaults to 400.", type: "integer", required: false },
  { key: "height", option: "--height <height>", name: "height", description: "Resize preview image height, Pass an integer between 0 to 2000. Defaults to 400.", type: "integer", required: false },
];
avatars
  .command(`get-image`)
  .description(`Use this endpoint to fetch a remote image URL and crop it to any image size you want. This endpoint is very useful if you need to crop and display remote images in your app or in case you want to make sure a 3rd party image is properly served using a TLS protocol.

When one dimension is specified and the other is 0, the image is scaled with preserved aspect ratio. If both dimensions are 0, the API provides an image at source quality. If dimensions are not specified, the default size of image returned is 400x400px.

This endpoint does not follow HTTP redirects.`)
  .option(`--url <url>`, `Image URL which you want to crop. Must be publicly reachable and answer 200 with a raster image on the first request: the fetch does not follow redirects, so a URL that 301s answers 404, as does any URL whose response is not 200. The bytes are decoded by Imagick — an SVG (including most \`favicon.ico\` files, which are SVG in disguise) and a genuine \`.ico\` both fail to decode and answer 500.`)
  .option(`--width <width>`, `Resize preview image width, Pass an integer between 0 to 2000. Defaults to 400.`, parseInteger)
  .option(`--height <height>`, `Resize preview image height, Pass an integer between 0 to 2000. Defaults to 400.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { url, width, height } = await promptForMissing(
          _options,
          getImageSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/avatars/image`;
        const _payload: RequestParams = {};
        if (url !== undefined) {
          _payload[`url`] = url;
        }
        if (width !== undefined) {
          _payload[`width`] = width;
        }
        if (height !== undefined) {
          _payload[`height`] = height;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(avatars.commands.at(-1)!, getImageSpecs, { method: "get" });
const getInitialsSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Full Name. When empty, current user name or email will be used. Max length: 128 chars.", type: "string", required: false },
  { key: "width", option: "--width <width>", name: "width", description: "Image width. Pass an integer between 0 to 2000. Defaults to 100.", type: "integer", required: false },
  { key: "height", option: "--height <height>", name: "height", description: "Image height. Pass an integer between 0 to 2000. Defaults to 100.", type: "integer", required: false },
  { key: "background", option: "--background <background>", name: "background", description: "Changes background color. By default a random color will be picked and stay will persistent to the given name.", type: "string", required: false },
];
avatars
  .command(`get-initials`)
  .description(`Use this endpoint to show your user initials avatar icon on your website or app. By default, this route will try to print your logged-in user name or email initials. You can also overwrite the user name if you pass the 'name' parameter. If no name is given and no user is logged, an empty avatar will be returned.

You can use the color and background params to change the avatar colors. By default, a random theme will be selected. The random theme will persist for the user's initials when reloading the same theme will always return for the same initials.

When one dimension is specified and the other is 0, the image is scaled with preserved aspect ratio. If both dimensions are 0, the API provides an image at source quality. If dimensions are not specified, the default size of image returned is 100x100px.`)
  .option(`--name <name>`, `Full Name. When empty, current user name or email will be used. Max length: 128 chars.`)
  .option(`--width <width>`, `Image width. Pass an integer between 0 to 2000. Defaults to 100.`, parseInteger)
  .option(`--height <height>`, `Image height. Pass an integer between 0 to 2000. Defaults to 100.`, parseInteger)
  .option(`--background <background>`, `Changes background color. By default a random color will be picked and stay will persistent to the given name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, width, height, background } = await promptForMissing(
          _options,
          getInitialsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/avatars/initials`;
        const _payload: RequestParams = {};
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (width !== undefined) {
          _payload[`width`] = width;
        }
        if (height !== undefined) {
          _payload[`height`] = height;
        }
        if (background !== undefined) {
          _payload[`background`] = background;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(avatars.commands.at(-1)!, getInitialsSpecs, { method: "get" });
const getQrSpecs: PromptSpec[] = [
  { key: "text", option: "--text <text>", name: "text", description: "Plain text to be converted to QR code image.", type: "string", required: true },
  { key: "size", option: "--size <size>", name: "size", description: "QR code size. Pass an integer between 1 to 1000. Defaults to 400.", type: "integer", required: false },
  { key: "margin", option: "--margin <margin>", name: "margin", description: "Margin from edge. Pass an integer between 0 to 10. Defaults to 1.", type: "integer", required: false },
  { key: "download", option: "--download <download>", name: "download", description: "Return resulting image with 'Content-Disposition: attachment ' headers for the browser to start downloading it. Pass 0 for no header, or 1 for otherwise. Default value is set to 0.", type: "boolean", required: false },
];
avatars
  .command(`get-qr`)
  .description(`Converts a given plain text to a QR code image. You can use the query parameters to change the size and style of the resulting image.`)
  .option(`--text <text>`, `Plain text to be converted to QR code image.`)
  .option(`--size <size>`, `QR code size. Pass an integer between 1 to 1000. Defaults to 400.`, parseInteger)
  .option(`--margin <margin>`, `Margin from edge. Pass an integer between 0 to 10. Defaults to 1.`, parseInteger)
  .option(
    `--download [value]`,
    `Return resulting image with 'Content-Disposition: attachment ' headers for the browser to start downloading it. Pass 0 for no header, or 1 for otherwise. Default value is set to 0.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { text, size, margin, download } = await promptForMissing(
          _options,
          getQrSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/avatars/qr`;
        const _payload: RequestParams = {};
        if (text !== undefined) {
          _payload[`text`] = text;
        }
        if (size !== undefined) {
          _payload[`size`] = size;
        }
        if (margin !== undefined) {
          _payload[`margin`] = margin;
        }
        if (download !== undefined) {
          _payload[`download`] = download;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(avatars.commands.at(-1)!, getQrSpecs, { method: "get" });
const getScreenshotSpecs: PromptSpec[] = [
  { key: "url", option: "--url <url>", name: "url", description: "Website URL which you want to capture.", type: "string", required: true },
  { key: "headers", option: "--headers <headers>", name: "headers", description: "HTTP headers to send with the browser request. Defaults to empty.", type: "object", required: false },
  { key: "viewportWidth", option: "--viewport-width <viewport-width>", name: "viewportWidth", description: "Browser viewport width. Pass an integer between 1 to 1920. Defaults to 1280.", type: "integer", required: false },
  { key: "viewportHeight", option: "--viewport-height <viewport-height>", name: "viewportHeight", description: "Browser viewport height. Pass an integer between 1 to 1080. Defaults to 720.", type: "integer", required: false },
  { key: "scale", option: "--scale <scale>", name: "scale", description: "Browser scale factor. Pass a number between 0.1 to 3. Defaults to 1.", type: "number", required: false },
  { key: "theme", option: "--theme <theme>", name: "theme", description: "Browser theme. Pass \"light\" or \"dark\". Defaults to \"light\".", type: "string", required: false, enum: ["light","dark"] },
  { key: "userAgent", option: "--user-agent <user-agent>", name: "userAgent", description: "Custom user agent string. Defaults to browser default.", type: "string", required: false },
  { key: "fullpage", option: "--fullpage <fullpage>", name: "fullpage", description: "Capture full page scroll. Pass 0 for viewport only, or 1 for full page. Defaults to 0.", type: "boolean", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Browser locale (e.g., \"en-US\", \"fr-FR\"). Defaults to browser default.", type: "string", required: false },
  { key: "timezone", option: "--timezone <timezone>", name: "timezone", description: "IANA timezone identifier, canonically cased (e.g. `America/New_York`, `Europe/London`). Defaults to the browser default. Only two-segment identifiers are accepted: `UTC` and the three-segment ids such as `America/Argentina/Buenos_Aires` are refused with 404.", type: "string", required: false, enum: ["Africa/Abidjan","Africa/Accra","Africa/Addis_Ababa","Africa/Algiers","Africa/Asmara","Africa/Bamako","Africa/Bangui","Africa/Banjul","Africa/Bissau","Africa/Blantyre","Africa/Brazzaville","Africa/Bujumbura","Africa/Cairo","Africa/Casablanca","Africa/Ceuta","Africa/Conakry","Africa/Dakar","Africa/Dar_es_Salaam","Africa/Djibouti","Africa/Douala","Africa/El_Aaiun","Africa/Freetown","Africa/Gaborone","Africa/Harare","Africa/Johannesburg","Africa/Juba","Africa/Kampala","Africa/Khartoum","Africa/Kigali","Africa/Kinshasa","Africa/Lagos","Africa/Libreville","Africa/Lome","Africa/Luanda","Africa/Lubumbashi","Africa/Lusaka","Africa/Malabo","Africa/Maputo","Africa/Maseru","Africa/Mbabane","Africa/Mogadishu","Africa/Monrovia","Africa/Nairobi","Africa/Ndjamena","Africa/Niamey","Africa/Nouakchott","Africa/Ouagadougou","Africa/Porto-Novo","Africa/Sao_Tome","Africa/Tripoli","Africa/Tunis","Africa/Windhoek","America/Adak","America/Anchorage","America/Anguilla","America/Antigua","America/Araguaina","America/Aruba","America/Asuncion","America/Atikokan","America/Bahia","America/Bahia_Banderas","America/Barbados","America/Belem","America/Belize","America/Blanc-Sablon","America/Boa_Vista","America/Bogota","America/Boise","America/Cambridge_Bay","America/Campo_Grande","America/Cancun","America/Caracas","America/Cayenne","America/Cayman","America/Chicago","America/Chihuahua","America/Ciudad_Juarez","America/Costa_Rica","America/Coyhaique","America/Creston","America/Cuiaba","America/Curacao","America/Danmarkshavn","America/Dawson","America/Dawson_Creek","America/Denver","America/Detroit","America/Dominica","America/Edmonton","America/Eirunepe","America/El_Salvador","America/Fort_Nelson","America/Fortaleza","America/Glace_Bay","America/Goose_Bay","America/Grand_Turk","America/Grenada","America/Guadeloupe","America/Guatemala","America/Guayaquil","America/Guyana","America/Halifax","America/Havana","America/Hermosillo","America/Inuvik","America/Iqaluit","America/Jamaica","America/Juneau","America/Kralendijk","America/La_Paz","America/Lima","America/Los_Angeles","America/Lower_Princes","America/Maceio","America/Managua","America/Manaus","America/Marigot","America/Martinique","America/Matamoros","America/Mazatlan","America/Menominee","America/Merida","America/Metlakatla","America/Mexico_City","America/Miquelon","America/Moncton","America/Monterrey","America/Montevideo","America/Montserrat","America/Nassau","America/New_York","America/Nome","America/Noronha","America/Nuuk","America/Ojinaga","America/Panama","America/Paramaribo","America/Phoenix","America/Port-au-Prince","America/Port_of_Spain","America/Porto_Velho","America/Puerto_Rico","America/Punta_Arenas","America/Rankin_Inlet","America/Recife","America/Regina","America/Resolute","America/Rio_Branco","America/Santarem","America/Santiago","America/Santo_Domingo","America/Sao_Paulo","America/Scoresbysund","America/Sitka","America/St_Barthelemy","America/St_Johns","America/St_Kitts","America/St_Lucia","America/St_Thomas","America/St_Vincent","America/Swift_Current","America/Tegucigalpa","America/Thule","America/Tijuana","America/Toronto","America/Tortola","America/Vancouver","America/Whitehorse","America/Winnipeg","America/Yakutat","Antarctica/Casey","Antarctica/Davis","Antarctica/DumontDUrville","Antarctica/Macquarie","Antarctica/Mawson","Antarctica/McMurdo","Antarctica/Palmer","Antarctica/Rothera","Antarctica/Syowa","Antarctica/Troll","Antarctica/Vostok","Arctic/Longyearbyen","Asia/Aden","Asia/Almaty","Asia/Amman","Asia/Anadyr","Asia/Aqtau","Asia/Aqtobe","Asia/Ashgabat","Asia/Atyrau","Asia/Baghdad","Asia/Bahrain","Asia/Baku","Asia/Bangkok","Asia/Barnaul","Asia/Beirut","Asia/Bishkek","Asia/Brunei","Asia/Chita","Asia/Colombo","Asia/Damascus","Asia/Dhaka","Asia/Dili","Asia/Dubai","Asia/Dushanbe","Asia/Famagusta","Asia/Gaza","Asia/Hebron","Asia/Ho_Chi_Minh","Asia/Hong_Kong","Asia/Hovd","Asia/Irkutsk","Asia/Jakarta","Asia/Jayapura","Asia/Jerusalem","Asia/Kabul","Asia/Kamchatka","Asia/Karachi","Asia/Kathmandu","Asia/Khandyga","Asia/Kolkata","Asia/Krasnoyarsk","Asia/Kuala_Lumpur","Asia/Kuching","Asia/Kuwait","Asia/Macau","Asia/Magadan","Asia/Makassar","Asia/Manila","Asia/Muscat","Asia/Nicosia","Asia/Novokuznetsk","Asia/Novosibirsk","Asia/Omsk","Asia/Oral","Asia/Phnom_Penh","Asia/Pontianak","Asia/Pyongyang","Asia/Qatar","Asia/Qostanay","Asia/Qyzylorda","Asia/Riyadh","Asia/Sakhalin","Asia/Samarkand","Asia/Seoul","Asia/Shanghai","Asia/Singapore","Asia/Srednekolymsk","Asia/Taipei","Asia/Tashkent","Asia/Tbilisi","Asia/Tehran","Asia/Thimphu","Asia/Tokyo","Asia/Tomsk","Asia/Ulaanbaatar","Asia/Urumqi","Asia/Ust-Nera","Asia/Vientiane","Asia/Vladivostok","Asia/Yakutsk","Asia/Yangon","Asia/Yekaterinburg","Asia/Yerevan","Atlantic/Azores","Atlantic/Bermuda","Atlantic/Canary","Atlantic/Cape_Verde","Atlantic/Faroe","Atlantic/Madeira","Atlantic/Reykjavik","Atlantic/South_Georgia","Atlantic/St_Helena","Atlantic/Stanley","Australia/Adelaide","Australia/Brisbane","Australia/Broken_Hill","Australia/Darwin","Australia/Eucla","Australia/Hobart","Australia/Lindeman","Australia/Lord_Howe","Australia/Melbourne","Australia/Perth","Australia/Sydney","Europe/Amsterdam","Europe/Andorra","Europe/Astrakhan","Europe/Athens","Europe/Belgrade","Europe/Berlin","Europe/Bratislava","Europe/Brussels","Europe/Bucharest","Europe/Budapest","Europe/Busingen","Europe/Chisinau","Europe/Copenhagen","Europe/Dublin","Europe/Gibraltar","Europe/Guernsey","Europe/Helsinki","Europe/Isle_of_Man","Europe/Istanbul","Europe/Jersey","Europe/Kaliningrad","Europe/Kirov","Europe/Kyiv","Europe/Lisbon","Europe/Ljubljana","Europe/London","Europe/Luxembourg","Europe/Madrid","Europe/Malta","Europe/Mariehamn","Europe/Minsk","Europe/Monaco","Europe/Moscow","Europe/Oslo","Europe/Paris","Europe/Podgorica","Europe/Prague","Europe/Riga","Europe/Rome","Europe/Samara","Europe/San_Marino","Europe/Sarajevo","Europe/Saratov","Europe/Simferopol","Europe/Skopje","Europe/Sofia","Europe/Stockholm","Europe/Tallinn","Europe/Tirane","Europe/Ulyanovsk","Europe/Vaduz","Europe/Vatican","Europe/Vienna","Europe/Vilnius","Europe/Volgograd","Europe/Warsaw","Europe/Zagreb","Europe/Zurich","Indian/Antananarivo","Indian/Chagos","Indian/Christmas","Indian/Cocos","Indian/Comoro","Indian/Kerguelen","Indian/Mahe","Indian/Maldives","Indian/Mauritius","Indian/Mayotte","Indian/Reunion","Pacific/Apia","Pacific/Auckland","Pacific/Bougainville","Pacific/Chatham","Pacific/Chuuk","Pacific/Easter","Pacific/Efate","Pacific/Fakaofo","Pacific/Fiji","Pacific/Funafuti","Pacific/Galapagos","Pacific/Gambier","Pacific/Guadalcanal","Pacific/Guam","Pacific/Honolulu","Pacific/Kanton","Pacific/Kiritimati","Pacific/Kosrae","Pacific/Kwajalein","Pacific/Majuro","Pacific/Marquesas","Pacific/Midway","Pacific/Nauru","Pacific/Niue","Pacific/Norfolk","Pacific/Noumea","Pacific/Pago_Pago","Pacific/Palau","Pacific/Pitcairn","Pacific/Pohnpei","Pacific/Port_Moresby","Pacific/Rarotonga","Pacific/Saipan","Pacific/Tahiti","Pacific/Tarawa","Pacific/Tongatapu","Pacific/Wake","Pacific/Wallis"] },
  { key: "latitude", option: "--latitude <latitude>", name: "latitude", description: "Geolocation latitude. Pass a number between -90 to 90. Defaults to 0.", type: "number", required: false },
  { key: "longitude", option: "--longitude <longitude>", name: "longitude", description: "Geolocation longitude. Pass a number between -180 to 180. Defaults to 0.", type: "number", required: false },
  { key: "accuracy", option: "--accuracy <accuracy>", name: "accuracy", description: "Geolocation accuracy in meters. Pass a number between 0 to 100000. Defaults to 0.", type: "number", required: false },
  { key: "touch", option: "--touch <touch>", name: "touch", description: "Enable touch support. Pass 0 for no touch, or 1 for touch enabled. Defaults to 0.", type: "boolean", required: false },
  { key: "permissions", option: "--permissions [permissions...]", name: "permissions", description: "Browser permissions to grant. Pass an array of permission names like [\"geolocation\", \"camera\", \"microphone\"]. Defaults to empty.", type: "array", required: false, enum: ["geolocation","camera","microphone","notifications","midi","push","clipboard-read","clipboard-write","payment-handler","usb","bluetooth","accelerometer","gyroscope","magnetometer","ambient-light-sensor","background-sync","persistent-storage","screen-wake-lock","web-share","xr-spatial-tracking"] },
  { key: "sleep", option: "--sleep <sleep>", name: "sleep", description: "Wait time in seconds before taking the screenshot. Pass an integer between 0 to 10. Defaults to 0.", type: "integer", required: false },
  { key: "width", option: "--width <width>", name: "width", description: "Output image width. Pass 0 to use original width, or an integer between 1 to 2000. Defaults to 0 (original width).", type: "integer", required: false },
  { key: "height", option: "--height <height>", name: "height", description: "Output image height. Pass 0 to use original height, or an integer between 1 to 2000. Defaults to 0 (original height).", type: "integer", required: false },
  { key: "quality", option: "--quality <quality>", name: "quality", description: "Screenshot quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.", type: "integer", required: false },
  { key: "outputFormat", option: "--output-format <output-format>", name: "output", description: "Output format type (jpeg, jpg, png, gif and webp).", type: "string", required: false, enum: ["jpg","jpeg","png","webp","heic","avif","gif"] },
];
avatars
  .command(`get-screenshot`)
  .description(`Use this endpoint to capture a screenshot of any website URL. This endpoint uses a headless browser to render the webpage and capture it as an image.

You can configure the browser viewport size, theme, user agent, geolocation, permissions, and more. Capture either just the viewport or the full page scroll.

When width and height are specified, the image is resized accordingly. If both dimensions are 0, the API provides an image at original size. If dimensions are not specified, the default viewport size is 1280x720px.`)
  .option(`--url <url>`, `Website URL which you want to capture.`)
  .option(`--headers <headers>`, `HTTP headers to send with the browser request. Defaults to empty.`)
  .option(`--viewport-width <viewport-width>`, `Browser viewport width. Pass an integer between 1 to 1920. Defaults to 1280.`, parseInteger)
  .option(`--viewport-height <viewport-height>`, `Browser viewport height. Pass an integer between 1 to 1080. Defaults to 720.`, parseInteger)
  .option(`--scale <scale>`, `Browser scale factor. Pass a number between 0.1 to 3. Defaults to 1.`, parseInteger)
  .option(`--theme <theme>`, `Browser theme. Pass "light" or "dark". Defaults to "light".`)
  .option(`--user-agent <user-agent>`, `Custom user agent string. Defaults to browser default.`)
  .option(
    `--fullpage [value]`,
    `Capture full page scroll. Pass 0 for viewport only, or 1 for full page. Defaults to 0.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--locale <locale>`, `Browser locale (e.g., "en-US", "fr-FR"). Defaults to browser default.`)
  .option(`--timezone <timezone>`, `IANA timezone identifier, canonically cased (e.g. \`America/New_York\`, \`Europe/London\`). Defaults to the browser default. Only two-segment identifiers are accepted: \`UTC\` and the three-segment ids such as \`America/Argentina/Buenos_Aires\` are refused with 404.`)
  .option(`--latitude <latitude>`, `Geolocation latitude. Pass a number between -90 to 90. Defaults to 0.`, parseInteger)
  .option(`--longitude <longitude>`, `Geolocation longitude. Pass a number between -180 to 180. Defaults to 0.`, parseInteger)
  .option(`--accuracy <accuracy>`, `Geolocation accuracy in meters. Pass a number between 0 to 100000. Defaults to 0.`, parseInteger)
  .option(
    `--touch [value]`,
    `Enable touch support. Pass 0 for no touch, or 1 for touch enabled. Defaults to 0.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--permissions [permissions...]`, `Browser permissions to grant. Pass an array of permission names like ["geolocation", "camera", "microphone"]. Defaults to empty.`)
  .option(`--sleep <sleep>`, `Wait time in seconds before taking the screenshot. Pass an integer between 0 to 10. Defaults to 0.`, parseInteger)
  .option(`--width <width>`, `Output image width. Pass 0 to use original width, or an integer between 1 to 2000. Defaults to 0 (original width).`, parseInteger)
  .option(`--height <height>`, `Output image height. Pass 0 to use original height, or an integer between 1 to 2000. Defaults to 0 (original height).`, parseInteger)
  .option(`--quality <quality>`, `Screenshot quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.`, parseInteger)
  .option(`--output-format <output-format>`, `Output format type (jpeg, jpg, png, gif and webp).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { url, headers, viewportWidth, viewportHeight, scale, theme, userAgent, fullpage, locale, timezone, latitude, longitude, accuracy, touch, permissions, sleep, width, height, quality, outputFormat } = await promptForMissing(
          _options,
          getScreenshotSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/avatars/screenshots`;
        const _payload: RequestParams = {};
        if (url !== undefined) {
          _payload[`url`] = url;
        }
        if (headers !== undefined) {
          _payload[`headers`] = resolveBodyParam(headers);
        }
        if (viewportWidth !== undefined) {
          _payload[`viewportWidth`] = viewportWidth;
        }
        if (viewportHeight !== undefined) {
          _payload[`viewportHeight`] = viewportHeight;
        }
        if (scale !== undefined) {
          _payload[`scale`] = scale;
        }
        if (theme !== undefined) {
          _payload[`theme`] = theme;
        }
        if (userAgent !== undefined) {
          _payload[`userAgent`] = userAgent;
        }
        if (fullpage !== undefined) {
          _payload[`fullpage`] = fullpage;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (timezone !== undefined) {
          _payload[`timezone`] = timezone;
        }
        if (latitude !== undefined) {
          _payload[`latitude`] = latitude;
        }
        if (longitude !== undefined) {
          _payload[`longitude`] = longitude;
        }
        if (accuracy !== undefined) {
          _payload[`accuracy`] = accuracy;
        }
        if (touch !== undefined) {
          _payload[`touch`] = touch;
        }
        if (permissions !== undefined) {
          _payload[`permissions`] = permissions;
        }
        if (sleep !== undefined) {
          _payload[`sleep`] = sleep;
        }
        if (width !== undefined) {
          _payload[`width`] = width;
        }
        if (height !== undefined) {
          _payload[`height`] = height;
        }
        if (quality !== undefined) {
          _payload[`quality`] = quality;
        }
        if (outputFormat !== undefined) {
          _payload[`output`] = outputFormat;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(avatars.commands.at(-1)!, getScreenshotSpecs, { method: "get" });
