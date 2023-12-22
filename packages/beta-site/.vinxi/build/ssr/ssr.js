import { createComponent, isServer, getRequestEvent, delegateEvents, ssrElement, escape, mergeProps, ssr, ssrHydrationKey, ssrAttribute, ssrStyle, useAssets, NoHydration, HydrationScript, Hydration, renderToStream } from "solid-js/web";
import { toWebRequest, getRequestIP, setResponseHeader, setResponseStatus, appendResponseHeader, getResponseHeader, removeResponseHeader, getCookie, setCookie, eventHandler, sendRedirect, setHeader } from "h3";
import { children, createMemo, on, createRoot, Show, createSignal, onCleanup, lazy, createComponent as createComponent$1, For, onMount, splitProps, createEffect, Suspense, ErrorBoundary as ErrorBoundary$1 } from "solid-js";
import { u as useViewTransition, A as ASSETS, M as MetaProvider } from "./assets/index-ad02a4fd.js";
import { createContextProvider } from "@solid-primitives/context";
import { createStore, produce } from "solid-js/store";
import { c as createBranches, a as createRouterContext, R as RouterContextObj, g as getRouteMatches, b as createMemoObject, d as createRouteContext, e as RouteContextObj, u as useLocation } from "./assets/routing-b19590dd.js";
import { provideRequestEvent } from "solid-js/web/storage";
const createRouterComponent = (router) => (props) => {
  const {
    base
  } = props;
  const routeDefs = children(() => props.children);
  const branches = createMemo(() => createBranches(props.root ? {
    component: props.root,
    children: routeDefs()
  } : routeDefs(), props.base || ""));
  const routerState = createRouterContext(router, branches, {
    base
  });
  router.create && router.create(routerState);
  return createComponent(RouterContextObj.Provider, {
    value: routerState,
    get children() {
      return createComponent(Routes, {
        routerState,
        get branches() {
          return branches();
        }
      });
    }
  });
};
function Routes(props) {
  const matches = createMemo(() => getRouteMatches(props.branches, props.routerState.location.pathname));
  if (isServer) {
    const e = getRequestEvent();
    e && (e.routerMatches || (e.routerMatches = [])).push(matches().map(({
      route: route2,
      path,
      params: params2
    }) => ({
      path: route2.originalPath,
      pattern: route2.pattern,
      match: path,
      params: params2,
      metadata: route2.metadata
    })));
  }
  const params = createMemoObject(() => {
    const m = matches();
    const params2 = {};
    for (let i = 0; i < m.length; i++) {
      Object.assign(params2, m[i].params);
    }
    return params2;
  });
  const disposers = [];
  let root;
  const routeStates = createMemo(on(matches, (nextMatches, prevMatches, prev) => {
    let equal = prevMatches && nextMatches.length === prevMatches.length;
    const next = [];
    for (let i = 0, len = nextMatches.length; i < len; i++) {
      const prevMatch = prevMatches && prevMatches[i];
      const nextMatch = nextMatches[i];
      if (prev && prevMatch && nextMatch.route.key === prevMatch.route.key) {
        next[i] = prev[i];
      } else {
        equal = false;
        if (disposers[i]) {
          disposers[i]();
        }
        createRoot((dispose) => {
          disposers[i] = dispose;
          next[i] = createRouteContext(props.routerState, next[i - 1] || props.routerState.base, createOutlet(() => routeStates()[i + 1]), () => matches()[i], params);
        });
      }
    }
    disposers.splice(nextMatches.length).forEach((dispose) => dispose());
    if (prev && equal) {
      return prev;
    }
    root = next[0];
    return next;
  }));
  return createComponent(Show, {
    get when() {
      return routeStates() && root;
    },
    keyed: true,
    children: (route2) => createComponent(RouteContextObj.Provider, {
      value: route2,
      get children() {
        return route2.outlet();
      }
    })
  });
}
const createOutlet = (child) => {
  return () => createComponent(Show, {
    get when() {
      return child();
    },
    keyed: true,
    children: (child2) => createComponent(RouteContextObj.Provider, {
      value: child2,
      get children() {
        return child2.outlet();
      }
    })
  });
};
function intercept([value, setValue], get, set) {
  return [get ? () => get(value()) : value, set ? (v) => setValue(set(v)) : setValue];
}
function querySelector(selector) {
  if (selector === "#") {
    return null;
  }
  try {
    return document.querySelector(selector);
  } catch (e) {
    return null;
  }
}
function createRouter(config) {
  let ignore = false;
  const wrap = (value) => typeof value === "string" ? {
    value
  } : value;
  const signal = intercept(createSignal(wrap(config.get()), {
    equals: (a, b) => a.value === b.value
  }), void 0, (next) => {
    !ignore && config.set(next);
    return next;
  });
  config.init && onCleanup(config.init((value = config.get()) => {
    ignore = true;
    signal[1](wrap(value));
    ignore = false;
  }));
  return createRouterComponent({
    signal,
    create: config.create,
    utils: config.utils
  });
}
function bindEvent(target, type, handler2) {
  target.addEventListener(type, handler2);
  return () => target.removeEventListener(type, handler2);
}
function scrollToHash(hash, fallbackTop) {
  const el = querySelector(`#${hash}`);
  if (el) {
    el.scrollIntoView();
  } else if (fallbackTop) {
    window.scrollTo(0, 0);
  }
}
function getPath(url) {
  const u = new URL(url);
  return u.pathname + u.search;
}
function StaticRouter(props) {
  let e;
  const obj = {
    value: props.url || (e = getRequestEvent()) && getPath(e.request.url) || ""
  };
  return createRouterComponent({
    signal: [() => obj, (next) => Object.assign(obj, next)]
  })(props);
}
const actions = /* @__PURE__ */ new Map();
function setupNativeEvents(preload = true, explicitLinks = false, actionBase = "/_server") {
  return (router) => {
    const basePath = router.base.path();
    const navigateFromRoute = router.navigatorFactory(router.base);
    let preloadTimeout = {};
    function isSvg(el) {
      return el.namespaceURI === "http://www.w3.org/2000/svg";
    }
    function handleAnchor(evt) {
      if (evt.defaultPrevented || evt.button !== 0 || evt.metaKey || evt.altKey || evt.ctrlKey || evt.shiftKey)
        return;
      const a = evt.composedPath().find((el) => el instanceof Node && el.nodeName.toUpperCase() === "A");
      if (!a || explicitLinks && !a.getAttribute("link"))
        return;
      const svg = isSvg(a);
      const href = svg ? a.href.baseVal : a.href;
      const target = svg ? a.target.baseVal : a.target;
      if (target || !href && !a.hasAttribute("state"))
        return;
      const rel = (a.getAttribute("rel") || "").split(/\s+/);
      if (a.hasAttribute("download") || rel && rel.includes("external"))
        return;
      const url = svg ? new URL(href, document.baseURI) : new URL(href);
      if (url.origin !== window.location.origin || basePath && url.pathname && !url.pathname.toLowerCase().startsWith(basePath.toLowerCase()))
        return;
      return [a, url];
    }
    function handleAnchorClick(evt) {
      const res = handleAnchor(evt);
      if (!res)
        return;
      const [a, url] = res;
      const to = router.parsePath(url.pathname + url.search + url.hash);
      const state = a.getAttribute("state");
      evt.preventDefault();
      navigateFromRoute(to, {
        resolve: false,
        replace: a.hasAttribute("replace"),
        scroll: !a.hasAttribute("noscroll"),
        state: state && JSON.parse(state)
      });
    }
    function handleAnchorPreload(evt) {
      const res = handleAnchor(evt);
      if (!res)
        return;
      const [a, url] = res;
      if (!preloadTimeout[url.pathname])
        router.preloadRoute(url, a.getAttribute("preload") !== "false");
    }
    function handleAnchorIn(evt) {
      const res = handleAnchor(evt);
      if (!res)
        return;
      const [a, url] = res;
      if (preloadTimeout[url.pathname])
        return;
      preloadTimeout[url.pathname] = setTimeout(() => {
        router.preloadRoute(url, a.getAttribute("preload") !== "false");
        delete preloadTimeout[url.pathname];
      }, 200);
    }
    function handleAnchorOut(evt) {
      const res = handleAnchor(evt);
      if (!res)
        return;
      const [, url] = res;
      if (preloadTimeout[url.pathname]) {
        clearTimeout(preloadTimeout[url.pathname]);
        delete preloadTimeout[url.pathname];
      }
    }
    function handleFormSubmit(evt) {
      let actionRef = evt.submitter && evt.submitter.hasAttribute("formaction") ? evt.submitter.formAction : evt.target.action;
      if (!actionRef)
        return;
      if (!actionRef.startsWith("action:")) {
        const url = new URL(actionRef);
        actionRef = router.parsePath(url.pathname + url.search);
        if (!actionRef.startsWith(actionBase))
          return;
      }
      if (evt.target.method.toUpperCase() !== "POST")
        throw new Error("Only POST forms are supported for Actions");
      const handler2 = actions.get(actionRef);
      if (handler2) {
        evt.preventDefault();
        const data = new FormData(evt.target);
        handler2.call(router, data);
      }
    }
    delegateEvents(["click", "submit"]);
    document.addEventListener("click", handleAnchorClick);
    if (preload) {
      document.addEventListener("mouseover", handleAnchorIn);
      document.addEventListener("mouseout", handleAnchorOut);
      document.addEventListener("focusin", handleAnchorPreload);
      document.addEventListener("touchstart", handleAnchorPreload);
    }
    document.addEventListener("submit", handleFormSubmit);
    onCleanup(() => {
      document.removeEventListener("click", handleAnchorClick);
      if (preload) {
        document.removeEventListener("mouseover", handleAnchorIn);
        document.removeEventListener("mouseout", handleAnchorOut);
        document.removeEventListener("focusin", handleAnchorPreload);
        document.removeEventListener("touchstart", handleAnchorPreload);
      }
      document.removeEventListener("submit", handleFormSubmit);
    });
  };
}
function Router(props) {
  if (isServer)
    return StaticRouter(props);
  return createRouter({
    get: () => ({
      value: window.location.pathname + window.location.search + window.location.hash,
      state: history.state
    }),
    set({
      value,
      replace,
      scroll,
      state
    }) {
      if (replace) {
        window.history.replaceState(state, "", value);
      } else {
        window.history.pushState(state, "", value);
      }
      scrollToHash(window.location.hash.slice(1), scroll);
    },
    init: (notify) => bindEvent(window, "popstate", () => notify()),
    create: setupNativeEvents(props.preload, props.explicitLinks, props.actionBase),
    utils: {
      go: (delta) => window.history.go(delta)
    }
  })(props);
}
const _tmpl$$7 = " ";
const assetMap = {
  style: (props) => ssrElement("style", props.attrs, () => escape(props.children), true),
  link: (props) => ssrElement("link", props.attrs, void 0, true),
  script: (props) => {
    return props.attrs.src ? ssrElement("script", mergeProps(() => props.attrs, {
      get id() {
        return props.key;
      }
    }), () => ssr(_tmpl$$7), true) : null;
  }
};
function renderAsset(asset) {
  let {
    tag,
    attrs: {
      key,
      ...attrs
    } = {
      key: void 0
    },
    children: children2
  } = asset;
  return assetMap[tag]({
    attrs,
    key,
    children: children2
  });
}
function lazyRoute(component, clientManifest, serverManifest, exported = "default") {
  return lazy(async () => {
    {
      const mod = await component.import();
      const Component = mod[exported];
      let assets = await clientManifest.inputs?.[component.src].assets();
      const styles = assets.filter((asset) => asset.tag === "style" || asset.attrs.rel === "stylesheet");
      const Comp = (props) => {
        return [...styles.map((asset) => renderAsset(asset)), createComponent$1(Component, props)];
      };
      return {
        default: Comp
      };
    }
  });
}
const route = {
  metadata: {
    breadcrumbs: [{
      label: "Home",
      current: true
    }]
  }
};
const fileRoutes = [{
  "type": "page",
  "$component": {
    "src": "src/routes/[...404].tsx?pick=default&pick=$css",
    "build": () => import(
      /* @vite-ignore */
      "./_...404_.js"
    ),
    "import": () => import(
      /* @vite-ignore */
      "./_...404_.js"
    )
  },
  "path": "/*404",
  "filePath": "/home/luke/repos/indigestion-cards/packages/beta-site/src/routes/[...404].tsx"
}, {
  "type": "page",
  "$component": {
    "src": "src/routes/index.tsx?pick=default&pick=$css",
    "build": () => import(
      /* @vite-ignore */
      "./index.js"
    ),
    "import": () => import(
      /* @vite-ignore */
      "./index.js"
    )
  },
  "$$route": {
    "require": () => ({
      "route": route
    }),
    "src": "src/routes/index.tsx?pick=route"
  },
  "path": "/",
  "filePath": "/home/luke/repos/indigestion-cards/packages/beta-site/src/routes/index.tsx"
}];
const pageRoutes = defineRoutes(fileRoutes.filter((o) => o.type === "page"));
const apiRoutes = defineAPIRoutes(fileRoutes.filter((o) => o.type === "api"));
function matchAPIRoute(path, method) {
  const segments = path.split("/").filter(Boolean);
  routeLoop:
    for (const route2 of apiRoutes) {
      const matchSegments = route2.matchSegments;
      if (segments.length < matchSegments.length || !route2.wildcard && segments.length > matchSegments.length) {
        continue;
      }
      for (let index2 = 0; index2 < matchSegments.length; index2++) {
        const match = matchSegments[index2];
        if (!match) {
          continue;
        }
        if (segments[index2] !== match) {
          continue routeLoop;
        }
      }
      const handler2 = route2[`$${method}`];
      if (handler2 === "skip" || handler2 === void 0) {
        return;
      }
      const params = {};
      for (const {
        type,
        name,
        index: index2
      } of route2.params) {
        if (type === ":") {
          params[name] = segments[index2];
        } else {
          params[name] = segments.slice(index2).join("/");
        }
      }
      return {
        handler: handler2,
        params
      };
    }
}
function defineRoutes(fileRoutes2) {
  function processRoute(routes2, route2, id, full) {
    const parentRoute = Object.values(routes2).find((o) => {
      return id.startsWith(o.id + "/");
    });
    if (!parentRoute) {
      routes2.push({
        ...route2,
        id,
        path: id.replace(/\/\([^)/]+\)/g, "")
      });
      return routes2;
    }
    processRoute(parentRoute.children || (parentRoute.children = []), route2, id.slice(parentRoute.id.length));
    return routes2;
  }
  return fileRoutes2.sort((a, b) => a.path.length - b.path.length).reduce((prevRoutes, route2) => {
    return processRoute(prevRoutes, route2, route2.path, route2.path);
  }, []);
}
function defineAPIRoutes(routes2) {
  return routes2.flatMap((route2) => {
    const paths = expandOptionals(route2.path);
    return paths.map((path) => ({
      ...route2,
      path
    }));
  }).map(routeToMatchRoute).sort((a, b) => b.score - a.score);
}
function expandOptionals(pattern) {
  let match = /(\/?\:[^\/]+)\?/.exec(pattern);
  if (!match)
    return [pattern];
  let prefix = pattern.slice(0, match.index);
  let suffix = pattern.slice(match.index + match[0].length);
  const prefixes = [prefix, prefix += match[1]];
  while (match = /^(\/\:[^\/]+)\?/.exec(suffix)) {
    prefixes.push(prefix += match[1]);
    suffix = suffix.slice(match[0].length);
  }
  return expandOptionals(suffix).reduce((results, expansion) => [...results, ...prefixes.map((p) => p + expansion)], []);
}
function routeToMatchRoute(route2) {
  const segments = route2.path.split("/").filter(Boolean);
  const params = [];
  const matchSegments = [];
  let score = 0;
  let wildcard = false;
  for (const [index2, segment] of segments.entries()) {
    if (segment[0] === ":") {
      const name = segment.slice(1);
      score += 3;
      params.push({
        type: ":",
        name,
        index: index2
      });
      matchSegments.push(null);
    } else if (segment[0] === "*") {
      score -= 1;
      params.push({
        type: "*",
        name: segment.slice(1),
        index: index2
      });
      wildcard = true;
    } else {
      score += 4;
      matchSegments.push(segment);
    }
  }
  return {
    ...route2,
    score,
    params,
    matchSegments,
    wildcard
  };
}
function createRoutes() {
  function createRoute(route2) {
    return {
      ...route2,
      ...route2.$$route ? route2.$$route.require().route : void 0,
      metadata: {
        ...route2.$$route ? route2.$$route.require().route.metadata : {},
        filesystem: true
      },
      component: lazyRoute(route2.$component, globalThis.MANIFEST["client"], globalThis.MANIFEST["ssr"]),
      children: route2.children ? route2.children.map(createRoute) : void 0
    };
  }
  const routes2 = pageRoutes.map(createRoute);
  return routes2;
}
let routes;
const FileRoutes = () => {
  return isServer ? getRequestEvent().routes : routes || (routes = createRoutes());
};
const _tmpl$$6 = ["<div", ' class="max-w-main fixed right-10 top-10 z-50 mx-auto flex w-full flex-col gap-2"><ul class="absolute right-0 flex flex-col items-end gap-2 gap-x-5 pt-2">', "</ul></div>"], _tmpl$2$4 = ["<div", ' class="', '" style="', '"><div>', '</div><button><span class="opacity-50">✕</span></button></div>'];
const [AlertsProvider, useAlerts] = createContextProvider((props) => {
  const [state, setState] = createStore({
    // eslint-disable-next-line solid/reactivity -- this is just the initial setup, and is tracked afterward
    alerts: props.alerts
  });
  on(() => props.alerts, (alerts) => setState("alerts", alerts));
  return {
    alerts: () => state.alerts,
    deleteAlert: (index2) => {
      const alert = state.alerts[index2];
      if (!alert)
        return;
      const url = new URL(window.location.href);
      const searchParams = new URLSearchParams(url.search);
      if (searchParams.has("alert") && searchParams.get("alert") === alert.message) {
        searchParams.delete("alert");
        searchParams.delete("type");
        url.search = searchParams.toString();
        window.history.replaceState({}, "", url.toString());
      }
      useViewTransition(() => {
        setState("alerts", produce((alerts) => alerts.splice(index2, 1)));
      });
    },
    addAlert: (alert) => setState("alerts", produce((alerts) => alerts.push(alert)))
  };
}, {
  alerts: () => [],
  deleteAlert: () => {
  },
  addAlert: () => {
  }
});
function AlertBox() {
  const {
    alerts
  } = useAlerts();
  return ssr(_tmpl$$6, ssrHydrationKey(), escape(createComponent(For, {
    get each() {
      return alerts();
    },
    children: (alert, index2) => createComponent(Alert, {
      get index() {
        return index2();
      },
      alert
    })
  })));
}
const alertStyles = {
  success: "bg-teal-200 text-teal-950",
  error: "bg-red-200 text-red-950",
  info: "bg-blue-200 text-blue-950",
  warning: "bg-yellow-200 text-yellow-950"
};
function Alert(props) {
  const {
    alerts,
    deleteAlert
  } = useAlerts();
  onMount(() => {
    setTimeout(() => deleteAlert(props.index), 15e3);
  });
  return ssr(_tmpl$2$4, ssrHydrationKey(), `flex items-center gap-x-5 rounded p-4 ${escape(escape(alertStyles[props.alert.type], true), true)}`, `view-transition-name:alert-${escape(alerts().length, true) - escape(props.index, true)}`, escape(props.alert.message));
}
const [PageContextProvider, usePageContext] = createContextProvider(() => {
  const [state, setState] = createStore({
    breadcrumbs: []
  });
  return {
    breadcrumbs: () => state.breadcrumbs,
    setBreadcrumbs(breadcrumbs) {
      console.log({
        breadcrumbs
      });
      setState("breadcrumbs", breadcrumbs);
    }
  };
}, {
  breadcrumbs: () => [],
  setBreadcrumbs() {
  }
});
const _tmpl$$5 = ["<div", ' class="border-b border-b-gray-300 bg-white dark:border-b-gray-800 dark:bg-gray-950"><header class="max-w-main relative mx-auto flex items-center gap-4 px-4 py-2 text-white md:py-4"><nav class="scrollbar-hidden flex flex-1 items-center gap-2 overflow-x-scroll text-black md:gap-4"><a href="/" title="Home" class="mr-4 flex w-fit min-w-[2rem] items-center gap-4" style="', '"><img', ' alt="logo" class="block w-12 dark:invert" width="192"><div class="font-display hidden flex-1 flex-col pt-1 sm:flex"><span class="text-brand-main mt-1 text-2xl italic">indigestion</span><span class="-mt-2 text-lg text-gray-700 dark:text-gray-200">cards</span></div></a><!--$-->', "<!--/--></nav></header></div>"], _tmpl$2$3 = ["<a", ' style="', '" class="', '">', "</a>"];
function Header() {
  const headerLinks = [{
    href: "/card",
    title: "Cards"
  }, {
    href: "/user",
    title: "Users"
  }];
  const location = useLocation();
  return ssr(_tmpl$$5, ssrHydrationKey(), "view-transition-name:page-header-home-link", ssrAttribute("src", escape(ASSETS.LOGO, true), false), escape(createComponent(For, {
    each: headerLinks,
    children: (link) => ssr(_tmpl$2$3, ssrHydrationKey() + ssrAttribute("href", escape(link.href, true), false) + ssrAttribute("title", escape(link.title, true), false), `view-transition-name:page-header-nav-${escape(link.href, true)}`, `relative rounded px-2 py-1 transition-colors  ${location.pathname.startsWith(link.href) ? "text-brand-main bg-brand-100 dark:bg-brand-dark dark:hover:bg-brand-900 dark:hover:text-brand-main hover:bg-brand-200 hover:text-brand-dark font-bold dark:text-white" : ""} ${!location.pathname.startsWith(link.href) ? "text-gray-700 hover:bg-gray-200 hover:text-black dark:font-medium dark:text-gray-200 dark:hover:bg-gray-800 dark:hover:text-white" : ""}`, escape(link.title))
  })));
}
function IconTemplate(iconSrc, props) {
  const mergedProps = mergeProps(iconSrc.a, props);
  const [_, svgProps] = splitProps(mergedProps, ["src"]);
  const [content, setContent] = createSignal("");
  const rawContent = createMemo(() => props.title ? `${iconSrc.c}<title>${props.title}</title>` : iconSrc.c);
  createEffect(() => setContent(rawContent()));
  onCleanup(() => {
    setContent("");
  });
  return ssrElement("svg", mergeProps({
    get stroke() {
      return iconSrc.a?.stroke;
    },
    get color() {
      return props.color || "currentColor";
    },
    get fill() {
      return props.color || "currentColor";
    },
    "stroke-width": "0",
    get style() {
      return {
        ...props.style,
        overflow: "visible"
      };
    }
  }, svgProps, {
    get height() {
      return props.size || "1em";
    },
    get width() {
      return props.size || "1em";
    },
    xmlns: "http://www.w3.org/2000/svg",
    get innerHTML() {
      return content();
    }
  }), () => isServer && escape(ssr(rawContent())), true);
}
function FaBrandsPatreon(props) {
  return IconTemplate({ a: { "viewBox": "0 0 512 512" }, c: '<path d="M512 194.8c0 101.3-82.4 183.8-183.8 183.8-101.7 0-184.4-82.4-184.4-183.8 0-101.6 82.7-184.3 184.4-184.3C429.6 10.5 512 93.2 512 194.8zM0 501.5h90v-491H0v491z"/>' }, props);
}
function FaBrandsTwitch(props) {
  return IconTemplate({ a: { "viewBox": "0 0 512 512" }, c: '<path d="M391.17 103.47h-38.63v109.7h38.63ZM285 103h-38.63v109.75H285ZM120.83 0 24.31 91.42v329.16h115.83V512l96.53-91.42h77.25L487.69 256V0Zm328.24 237.75-77.22 73.12h-77.24l-67.6 64v-64h-86.87V36.58h308.93Z"/>' }, props);
}
function FaBrandsYoutube(props) {
  return IconTemplate({ a: { "viewBox": "0 0 576 512" }, c: '<path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z"/>' }, props);
}
const _tmpl$$4 = ["<footer", ' class="grid justify-center gap-1 border-t border-t-gray-300 bg-white py-6 text-center text-sm dark:border-t-gray-800 dark:bg-gray-950"><nav class="flex items-center gap-12"><a href="https://twitch.tv/lil_indigestion" target="_blank" class="hover:brightness-90" title="Twitch"><!--$-->', '<!--/--><span class="sr-only">Twitch</span></a><a href="https://www.youtube.com/@lilindigestion" target="_blank" class="hover:brightness-90" title="YouTube"><!--$-->', '<!--/--><span class="sr-only">YouTube</span></a><a href="https://www.patreon.com/lil_indigestion" target="_blank" class="hover:brightness-90" title="Patreon"><!--$-->', '<!--/--><span class="sr-only">Patreon</span></a></nav><p class="text-gray-900 dark:text-gray-50">&copy; <!--$-->', "<!--/--> lil_indigestion</p></footer>"];
function Footer() {
  return ssr(_tmpl$$4, ssrHydrationKey(), escape(createComponent(FaBrandsTwitch, {
    "class": "text-brand-main ",
    size: "36"
  })), escape(createComponent(FaBrandsYoutube, {
    "class": "text-brand-main ",
    size: "40"
  })), escape(createComponent(FaBrandsPatreon, {
    "class": "text-brand-main ",
    size: "33"
  })), escape((/* @__PURE__ */ new Date()).getFullYear()));
}
const _tmpl$$3 = ["<div", ' class="max-w-main mx-auto w-full"></div>'], _tmpl$2$2 = ["<div", ' class="relative flex flex-col overflow-y-scroll bg-gray-50 dark:bg-gray-950 md:col-start-2" id="page-scroll-wrapper"><!--$-->', "<!--/--><!--$-->", "<!--/--><!--$-->", '<!--/--><main style="', '" class="', '">', '</main><div id="card-preview"></div><!--$-->', "<!--/--></div>"], _tmpl$3 = ["<div", ' class="grid h-[100svh] grid-cols-1 overflow-hidden md:grid-cols-[max-content_1fr]" id="page-layout-wrapper">', "</div>"];
function PageLayout(props) {
  return ssr(_tmpl$3, ssrHydrationKey(), escape(createComponent(MetaProvider, {
    get children() {
      return createComponent(AlertsProvider, {
        alerts: [],
        get children() {
          return createComponent(PageContextProvider, {
            get children() {
              return ssr(_tmpl$2$2, ssrHydrationKey(), props.noHeader ? escape(null) : escape(createComponent(Header, {})), escape(createComponent(AlertBox, {})), escape(createComponent(Show, {
                get when() {
                  return !props.hideBreadcrumbs;
                },
                get children() {
                  return ssr(_tmpl$$3, ssrHydrationKey());
                }
              })), "view-transition-name:" + (props.wide ? escape(void 0, true) : "main"), `${!props.wide ? "max-w-main" : ""} ${escape(escape(props.class ?? "", true), true)} ${!props.noHeader ? "p-3" : ""} @container/main z-0 col-start-2 mx-auto mb-8 w-full flex-1`, escape(createComponent(Suspense, {
                fallback: "loading",
                get children() {
                  return props.children;
                }
              })), escape(createComponent(Footer, {})));
            }
          });
        }
      });
    }
  })));
}
const app = "";
const index = "";
function App() {
  return createComponent(Router, {
    root: PageLayout,
    get children() {
      return createComponent(FileRoutes, {});
    }
  });
}
const _tmpl$$2 = ["<div", ' style="padding:16px"><div style="', '"><p style="font-weight:bold" id="error-message">', '</p><button id="reset-errors" style="', '">Clear errors and retry</button><pre style="margin-top:8px;width:100%">', "</pre></div></div>"];
function ErrorBoundary(props) {
  return createComponent(ErrorBoundary$1, {
    fallback: (e) => createComponent(ErrorMessage, {
      error: e
    }),
    get children() {
      return props.children;
    }
  });
}
function ErrorMessage(props) {
  createEffect(() => console.error(props.error));
  return ssr(_tmpl$$2, ssrHydrationKey(), ssrStyle(`
          background-color: rgba(252, 165, 165);
          color: rgb(153, 27, 27);
          border-radius": 5px;
          overflow: scroll;
          padding: 16px;
          margin-bottom: 8px;
        `), escape(props.error.message), ssrStyle(`color: rgba(252, 165, 165);
            background-color: rgb(153, 27, 27);
            border-radius: 5px;
            padding: 4px 8px`), escape(props.error.stack));
}
const _tmpl$$1 = ["<script", ">", "<\/script>"], _tmpl$2$1 = ["<script", ' type="module" async', "><\/script>"];
const docType = ssr("<!DOCTYPE html>");
function StartServer(props) {
  const context = getRequestEvent();
  let assets = [];
  Promise.resolve().then(async () => {
    let current = context.routes;
    if (context.routerMatches && context.routerMatches[0]) {
      for (let i = 0; i < context.routerMatches[0].length; i++) {
        const match = context.routerMatches[0][i];
        if (match.metadata && match.metadata.filesystem) {
          const segment = current.find((r) => r.path === match.path);
          const part = globalThis.MANIFEST["client"].inputs[segment["$component"].src];
          const asset = await part.assets();
          assets.push.apply(assets, asset);
          current = segment.children;
        }
      }
    }
    assets = [...new Map(assets.map((item) => [item.attrs.key, item])).values()].filter((asset) => asset.attrs.rel === "modulepreload" && !context.assets.find((a) => a.attrs.key === asset.attrs.key));
  });
  useAssets(() => assets.length ? assets.map((m) => renderAsset(m)) : void 0);
  return createComponent(NoHydration, {
    get children() {
      return [docType, createComponent(props.document, {
        get assets() {
          return [createComponent(HydrationScript, {}), context.assets.map((m) => renderAsset(m))];
        },
        get scripts() {
          return [ssr(_tmpl$$1, ssrHydrationKey(), `window.manifest = ${JSON.stringify(context.manifest)}`), ssr(_tmpl$2$1, ssrHydrationKey(), ssrAttribute("src", escape(globalThis.MANIFEST["client"].inputs[globalThis.MANIFEST["client"].handler].output.path, true), false))];
        },
        get children() {
          return createComponent(Hydration, {
            get children() {
              return createComponent(ErrorBoundary, {
                get children() {
                  return createComponent(App, {});
                }
              });
            }
          });
        }
      })];
    }
  });
}
const h3EventSymbol = Symbol("h3Event");
const fetchEventSymbol = Symbol("fetchEvent");
const eventTraps = {
  get(target, prop) {
    if (prop === fetchEventSymbol)
      return target;
    return target[prop] ?? target[h3EventSymbol][prop];
  }
};
function createFetchEvent(event) {
  return new Proxy({
    request: toWebRequest(event),
    clientAddress: getRequestIP(event),
    locals: {},
    // @ts-ignore
    [h3EventSymbol]: event
  }, eventTraps);
}
function getFetchEvent(h3Event) {
  if (!h3Event[fetchEventSymbol]) {
    const fetchEvent = createFetchEvent(h3Event);
    h3Event[fetchEventSymbol] = fetchEvent;
  }
  return h3Event[fetchEventSymbol];
}
function initFromFlash(ctx) {
  const flash = getCookie(ctx, "flash");
  if (!flash)
    return;
  let param = JSON.parse(flash);
  if (!param || !param.result)
    return [];
  const input = [...param.input.slice(0, -1), new Map(param.input[param.input.length - 1])];
  setCookie(ctx, "flash", "", {
    maxAge: 0
  });
  return {
    url: param.url,
    result: param.error ? new Error(param.result) : param.result,
    input
  };
}
async function createPageEvent(ctx) {
  const clientManifest = globalThis.MANIFEST["client"];
  globalThis.MANIFEST["ssr"];
  setResponseHeader(ctx, "Content-Type", "text/html");
  const pageEvent = Object.assign(ctx, {
    manifest: await clientManifest.json(),
    assets: [...await clientManifest.inputs[clientManifest.handler].assets(), ...[]],
    initialSubmission: initFromFlash(ctx),
    routes: createRoutes(),
    components: {
      status: (props) => {
        setResponseStatus(ctx, props.code, props.text);
        return () => setResponseStatus(ctx, 200);
      },
      header: (props) => {
        if (props.append) {
          appendResponseHeader(ctx, props.name, props.value);
        } else {
          setResponseHeader(ctx, props.name, props.value);
        }
        return () => {
          const value = getResponseHeader(ctx, props.name);
          if (value && typeof value === "string") {
            const values = value.split(", ");
            const index2 = values.indexOf(props.value);
            index2 !== -1 && values.splice(index2, 1);
            if (values.length)
              setResponseHeader(ctx, props.name, values.join(", "));
            else
              removeResponseHeader(ctx, props.name);
          }
        };
      }
    },
    // prevUrl: prevPath || "",
    // mutation: mutation,
    // $type: FETCH_EVENT,
    $islands: /* @__PURE__ */ new Set()
  });
  return pageEvent;
}
function createHandler$1(fn, options = {}) {
  return eventHandler({
    onRequest: options.onRequest,
    onBeforeResponse: options.onBeforeResponse,
    handler: (e) => {
      const event = getFetchEvent(e);
      return provideRequestEvent(event, async () => {
        const match = matchAPIRoute(new URL(event.request.url).pathname, event.request.method);
        if (match) {
          const mod = await match.handler.import();
          const fn2 = mod[event.request.method];
          event.params = match.params;
          return await fn2(event);
        }
        const context = await createPageEvent(event);
        let cloned = {
          ...options
        };
        if (cloned.onCompleteAll) {
          const og = cloned.onCompleteAll;
          cloned.onCompleteAll = (options2) => {
            handleStreamCompleteRedirect(context)(options2);
            og(options2);
          };
        } else
          cloned.onCompleteAll = handleStreamCompleteRedirect(context);
        if (cloned.onCompleteShell) {
          const og = cloned.onCompleteShell;
          cloned.onCompleteShell = (options2) => {
            handleShellCompleteRedirect(context, e)();
            og(options2);
          };
        } else
          cloned.onCompleteShell = handleShellCompleteRedirect(context, e);
        const stream = renderToStream(() => fn(context), cloned);
        if (context.response && context.response.headers.get("Location")) {
          return sendRedirect(event, context.response.headers.get("Location"));
        }
        const {
          writable,
          readable
        } = new TransformStream();
        stream.pipeTo(writable);
        return readable;
      });
    }
  });
}
function handleShellCompleteRedirect(context, e) {
  return () => {
    if (context.response && context.response.headers.get("Location")) {
      setResponseStatus(e, 302);
      setHeader(e, "Location", context.response.headers.get("Location"));
    }
  };
}
function handleStreamCompleteRedirect(context) {
  return ({
    write
  }) => {
    const to = context.response && context.response.headers.get("Location");
    to && write(`<script>window.location="${to}"<\/script>`);
  };
}
function createHandler(fn, options = {}) {
  return createHandler$1(fn, {
    ...options,
    createPageEvent
  });
}
const _tmpl$ = ['<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="icon" type="image/png" href="/favicon.png">', "</head>"], _tmpl$2 = ["<html", ' lang="en">', '<body><div id="app">', "</div><!--$-->", "<!--/--></body></html>"];
const handler = createHandler(() => createComponent(StartServer, {
  document: ({
    assets,
    children: children2,
    scripts
  }) => ssr(_tmpl$2, ssrHydrationKey(), createComponent(NoHydration, {
    get children() {
      return ssr(_tmpl$, escape(assets));
    }
  }), escape(children2), escape(scripts))
}));
export {
  handler as default
};
