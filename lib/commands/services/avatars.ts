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
      `Generated avatars, initials, QR codes, country flags and favicons.`,
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
const getFaviconSpecs: PromptSpec[] = [
  { key: "url", option: "--url <url>", name: "url", description: "Website URL which you want to fetch the favicon from.", type: "string", required: true },
];
avatars
  .command(`get-favicon`)
  .description(`Use this endpoint to fetch the favorite icon (AKA favicon) of any remote website URL.

This endpoint does not follow HTTP redirects.`)
  .option(`--url <url>`, `Website URL which you want to fetch the favicon from.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { url } = await promptForMissing(
          _options,
          getFaviconSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/avatars/favicon`;
        const _payload: RequestParams = {};
        if (url !== undefined) {
          _payload[`url`] = url;
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
registerPromptSpecs(avatars.commands.at(-1)!, getFaviconSpecs, { method: "get" });
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
  { key: "url", option: "--url <url>", name: "url", description: "Image URL which you want to crop.", type: "string", required: true },
  { key: "width", option: "--width <width>", name: "width", description: "Resize preview image width, Pass an integer between 0 to 2000. Defaults to 400.", type: "integer", required: false },
  { key: "height", option: "--height <height>", name: "height", description: "Resize preview image height, Pass an integer between 0 to 2000. Defaults to 400.", type: "integer", required: false },
];
avatars
  .command(`get-image`)
  .description(`Use this endpoint to fetch a remote image URL and crop it to any image size you want. This endpoint is very useful if you need to crop and display remote images in your app or in case you want to make sure a 3rd party image is properly served using a TLS protocol.

When one dimension is specified and the other is 0, the image is scaled with preserved aspect ratio. If both dimensions are 0, the API provides an image at source quality. If dimensions are not specified, the default size of image returned is 400x400px.

This endpoint does not follow HTTP redirects.`)
  .option(`--url <url>`, `Image URL which you want to crop.`)
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
  { key: "timezone", option: "--timezone <timezone>", name: "timezone", description: "IANA timezone identifier (e.g., \"America/New_York\", \"Europe/London\"). Defaults to browser default.", type: "string", required: false, enum: ["africa/abidjan","africa/accra","africa/addis_ababa","africa/algiers","africa/asmara","africa/bamako","africa/bangui","africa/banjul","africa/bissau","africa/blantyre","africa/brazzaville","africa/bujumbura","africa/cairo","africa/casablanca","africa/ceuta","africa/conakry","africa/dakar","africa/dar_es_salaam","africa/djibouti","africa/douala","africa/el_aaiun","africa/freetown","africa/gaborone","africa/harare","africa/johannesburg","africa/juba","africa/kampala","africa/khartoum","africa/kigali","africa/kinshasa","africa/lagos","africa/libreville","africa/lome","africa/luanda","africa/lubumbashi","africa/lusaka","africa/malabo","africa/maputo","africa/maseru","africa/mbabane","africa/mogadishu","africa/monrovia","africa/nairobi","africa/ndjamena","africa/niamey","africa/nouakchott","africa/ouagadougou","africa/porto-novo","africa/sao_tome","africa/tripoli","africa/tunis","africa/windhoek","america/adak","america/anchorage","america/anguilla","america/antigua","america/araguaina","america/argentina/buenos_aires","america/argentina/catamarca","america/argentina/cordoba","america/argentina/jujuy","america/argentina/la_rioja","america/argentina/mendoza","america/argentina/rio_gallegos","america/argentina/salta","america/argentina/san_juan","america/argentina/san_luis","america/argentina/tucuman","america/argentina/ushuaia","america/aruba","america/asuncion","america/atikokan","america/bahia","america/bahia_banderas","america/barbados","america/belem","america/belize","america/blanc-sablon","america/boa_vista","america/bogota","america/boise","america/cambridge_bay","america/campo_grande","america/cancun","america/caracas","america/cayenne","america/cayman","america/chicago","america/chihuahua","america/ciudad_juarez","america/costa_rica","america/coyhaique","america/creston","america/cuiaba","america/curacao","america/danmarkshavn","america/dawson","america/dawson_creek","america/denver","america/detroit","america/dominica","america/edmonton","america/eirunepe","america/el_salvador","america/fort_nelson","america/fortaleza","america/glace_bay","america/goose_bay","america/grand_turk","america/grenada","america/guadeloupe","america/guatemala","america/guayaquil","america/guyana","america/halifax","america/havana","america/hermosillo","america/indiana/indianapolis","america/indiana/knox","america/indiana/marengo","america/indiana/petersburg","america/indiana/tell_city","america/indiana/vevay","america/indiana/vincennes","america/indiana/winamac","america/inuvik","america/iqaluit","america/jamaica","america/juneau","america/kentucky/louisville","america/kentucky/monticello","america/kralendijk","america/la_paz","america/lima","america/los_angeles","america/lower_princes","america/maceio","america/managua","america/manaus","america/marigot","america/martinique","america/matamoros","america/mazatlan","america/menominee","america/merida","america/metlakatla","america/mexico_city","america/miquelon","america/moncton","america/monterrey","america/montevideo","america/montserrat","america/nassau","america/new_york","america/nome","america/noronha","america/north_dakota/beulah","america/north_dakota/center","america/north_dakota/new_salem","america/nuuk","america/ojinaga","america/panama","america/paramaribo","america/phoenix","america/port-au-prince","america/port_of_spain","america/porto_velho","america/puerto_rico","america/punta_arenas","america/rankin_inlet","america/recife","america/regina","america/resolute","america/rio_branco","america/santarem","america/santiago","america/santo_domingo","america/sao_paulo","america/scoresbysund","america/sitka","america/st_barthelemy","america/st_johns","america/st_kitts","america/st_lucia","america/st_thomas","america/st_vincent","america/swift_current","america/tegucigalpa","america/thule","america/tijuana","america/toronto","america/tortola","america/vancouver","america/whitehorse","america/winnipeg","america/yakutat","antarctica/casey","antarctica/davis","antarctica/dumontdurville","antarctica/macquarie","antarctica/mawson","antarctica/mcmurdo","antarctica/palmer","antarctica/rothera","antarctica/syowa","antarctica/troll","antarctica/vostok","arctic/longyearbyen","asia/aden","asia/almaty","asia/amman","asia/anadyr","asia/aqtau","asia/aqtobe","asia/ashgabat","asia/atyrau","asia/baghdad","asia/bahrain","asia/baku","asia/bangkok","asia/barnaul","asia/beirut","asia/bishkek","asia/brunei","asia/chita","asia/colombo","asia/damascus","asia/dhaka","asia/dili","asia/dubai","asia/dushanbe","asia/famagusta","asia/gaza","asia/hebron","asia/ho_chi_minh","asia/hong_kong","asia/hovd","asia/irkutsk","asia/jakarta","asia/jayapura","asia/jerusalem","asia/kabul","asia/kamchatka","asia/karachi","asia/kathmandu","asia/khandyga","asia/kolkata","asia/krasnoyarsk","asia/kuala_lumpur","asia/kuching","asia/kuwait","asia/macau","asia/magadan","asia/makassar","asia/manila","asia/muscat","asia/nicosia","asia/novokuznetsk","asia/novosibirsk","asia/omsk","asia/oral","asia/phnom_penh","asia/pontianak","asia/pyongyang","asia/qatar","asia/qostanay","asia/qyzylorda","asia/riyadh","asia/sakhalin","asia/samarkand","asia/seoul","asia/shanghai","asia/singapore","asia/srednekolymsk","asia/taipei","asia/tashkent","asia/tbilisi","asia/tehran","asia/thimphu","asia/tokyo","asia/tomsk","asia/ulaanbaatar","asia/urumqi","asia/ust-nera","asia/vientiane","asia/vladivostok","asia/yakutsk","asia/yangon","asia/yekaterinburg","asia/yerevan","atlantic/azores","atlantic/bermuda","atlantic/canary","atlantic/cape_verde","atlantic/faroe","atlantic/madeira","atlantic/reykjavik","atlantic/south_georgia","atlantic/st_helena","atlantic/stanley","australia/adelaide","australia/brisbane","australia/broken_hill","australia/darwin","australia/eucla","australia/hobart","australia/lindeman","australia/lord_howe","australia/melbourne","australia/perth","australia/sydney","europe/amsterdam","europe/andorra","europe/astrakhan","europe/athens","europe/belgrade","europe/berlin","europe/bratislava","europe/brussels","europe/bucharest","europe/budapest","europe/busingen","europe/chisinau","europe/copenhagen","europe/dublin","europe/gibraltar","europe/guernsey","europe/helsinki","europe/isle_of_man","europe/istanbul","europe/jersey","europe/kaliningrad","europe/kirov","europe/kyiv","europe/lisbon","europe/ljubljana","europe/london","europe/luxembourg","europe/madrid","europe/malta","europe/mariehamn","europe/minsk","europe/monaco","europe/moscow","europe/oslo","europe/paris","europe/podgorica","europe/prague","europe/riga","europe/rome","europe/samara","europe/san_marino","europe/sarajevo","europe/saratov","europe/simferopol","europe/skopje","europe/sofia","europe/stockholm","europe/tallinn","europe/tirane","europe/ulyanovsk","europe/vaduz","europe/vatican","europe/vienna","europe/vilnius","europe/volgograd","europe/warsaw","europe/zagreb","europe/zurich","indian/antananarivo","indian/chagos","indian/christmas","indian/cocos","indian/comoro","indian/kerguelen","indian/mahe","indian/maldives","indian/mauritius","indian/mayotte","indian/reunion","pacific/apia","pacific/auckland","pacific/bougainville","pacific/chatham","pacific/chuuk","pacific/easter","pacific/efate","pacific/fakaofo","pacific/fiji","pacific/funafuti","pacific/galapagos","pacific/gambier","pacific/guadalcanal","pacific/guam","pacific/honolulu","pacific/kanton","pacific/kiritimati","pacific/kosrae","pacific/kwajalein","pacific/majuro","pacific/marquesas","pacific/midway","pacific/nauru","pacific/niue","pacific/norfolk","pacific/noumea","pacific/pago_pago","pacific/palau","pacific/pitcairn","pacific/pohnpei","pacific/port_moresby","pacific/rarotonga","pacific/saipan","pacific/tahiti","pacific/tarawa","pacific/tongatapu","pacific/wake","pacific/wallis","utc"] },
  { key: "latitude", option: "--latitude <latitude>", name: "latitude", description: "Geolocation latitude. Pass a number between -90 to 90. Defaults to 0.", type: "number", required: false },
  { key: "longitude", option: "--longitude <longitude>", name: "longitude", description: "Geolocation longitude. Pass a number between -180 to 180. Defaults to 0.", type: "number", required: false },
  { key: "accuracy", option: "--accuracy <accuracy>", name: "accuracy", description: "Geolocation accuracy in meters. Pass a number between 0 to 100000. Defaults to 0.", type: "number", required: false },
  { key: "touch", option: "--touch <touch>", name: "touch", description: "Enable touch support. Pass 0 for no touch, or 1 for touch enabled. Defaults to 0.", type: "boolean", required: false },
  { key: "permissions", option: "--permissions [permissions...]", name: "permissions", description: "Browser permissions to grant. Pass an array of permission names like [\"geolocation\", \"camera\", \"microphone\"]. Defaults to empty.", type: "array", required: false, enum: ["geolocation","camera","microphone","notifications","midi","push","clipboard-read","clipboard-write","payment-handler","usb","bluetooth","accelerometer","gyroscope","magnetometer","ambient-light-sensor","background-sync","persistent-storage","screen-wake-lock","web-share","xr-spatial-tracking"] },
  { key: "sleep", option: "--sleep <sleep>", name: "sleep", description: "Wait time in seconds before taking the screenshot. Pass an integer between 0 to 10. Defaults to 0.", type: "integer", required: false },
  { key: "width", option: "--width <width>", name: "width", description: "Output image width. Pass 0 to use original width, or an integer between 1 to 2000. Defaults to 0 (original width).", type: "integer", required: false },
  { key: "height", option: "--height <height>", name: "height", description: "Output image height. Pass 0 to use original height, or an integer between 1 to 2000. Defaults to 0 (original height).", type: "integer", required: false },
  { key: "quality", option: "--quality <quality>", name: "quality", description: "Screenshot quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.", type: "integer", required: false },
  { key: "output", option: "--output <output>", name: "output", description: "Output format type (jpeg, jpg, png, gif and webp).", type: "string", required: false, enum: ["jpg","jpeg","png","webp","heic","avif","gif"] },
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
  .option(`--timezone <timezone>`, `IANA timezone identifier (e.g., "America/New_York", "Europe/London"). Defaults to browser default.`)
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
  .option(`--output <output>`, `Output format type (jpeg, jpg, png, gif and webp).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { url, headers, viewportWidth, viewportHeight, scale, theme, userAgent, fullpage, locale, timezone, latitude, longitude, accuracy, touch, permissions, sleep, width, height, quality, output } = await promptForMissing(
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
        if (output !== undefined) {
          _payload[`output`] = output;
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
