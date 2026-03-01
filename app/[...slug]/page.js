"use client"
import { useRouter } from 'next/navigation'
import { use, useState, useEffect, Suspense, Fragment } from 'react'
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { AuthBar } from "@/components/auth-bar"
import { ModelManager } from "@/components/model-manager"
import { Footer } from "@/components/footer"
import { Modal } from "@/components/modal/modal" // Import the new Modal component
import { Button } from "@/components/button"
import AEMHeadless from '@adobe/aem-headless-client-js';
import { ProductListPage } from "@/components/product-list-page/product-list-page"
import { ProductDetail } from "@/components/product-detail/product-detail"
import { AmplienceWrapper } from "@/components/amplience/wrapper"
import { EditableCarousel } from "@/components/running-shoes-carousel/editable-carousel"
import { AmplienceSlot } from "@/components/amplience/drop-zone"
import { getProductWithVariants } from "@/lib/api/plp"
import { URL_LOCALE_SEGMENTS, DEFAULT_AEM_EDITOR_URL, DEFAULT_AEM_PROJECT } from "@/lib/constants"

export default function Page({ params }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [aemEnvironment, setAemEnvironment] = useState('');
  const [projectName, setProjectName] = useState('');
  const [config, setConfig] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editorProps, setEditorProp] = useState({});
  const [content, setContent] = useState(null)
  const [productDetail, setProductDetail] = useState(undefined) // ProductWithVariants | null
  const [productPdp, setProductPdp] = useState(null) // Amplience PDP content (key: pdp/content/{SKU})
  const isProductPath = resolvedParams?.slug?.[0] === 'product' && resolvedParams?.slug?.[1]
  const productSlug = resolvedParams?.slug?.[1]

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleSubmit = (e) => { }

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedAemEnv = localStorage.getItem('aemEnvironment');
    const storedProjectName = localStorage.getItem('projectName');
    const storedLocale = localStorage.getItem('locale') || 'en';
    const isInUniversalEditor = window.self !== window.top;
    const slugSegments = resolvedParams?.slug?.length ? resolvedParams.slug : ['home', 'home'];

    // When URL has full AEM path (e.g. /content/dam/v0/site/en/new-arrivals/new-arrivals), infer project from URL so page renders without config modal
    const isFullAemPathInUrl =
      slugSegments.length >= 5 &&
      slugSegments[0] === 'content' &&
      slugSegments[1] === 'dam' &&
      slugSegments[3] === 'site';
    const inferredProject = isFullAemPathInUrl ? slugSegments[2] : null;

    const aemEnv = storedAemEnv || (isInUniversalEditor ? DEFAULT_AEM_EDITOR_URL : '') || (inferredProject ? DEFAULT_AEM_EDITOR_URL : '');
    const aemProject = storedProjectName || (isInUniversalEditor ? DEFAULT_AEM_PROJECT : '') || inferredProject || '';

    setAemEnvironment(storedAemEnv || '');
    setProjectName(storedProjectName || '');

    if (!aemEnv || !aemProject) {
      if (!isInUniversalEditor) setShowModal(true);
      return;
    }
    setConfig({
      env: aemEnv,
      project: aemProject,
    });

    // Don't fetch AEM screen for product detail routes; use minimal UE instrumentation so the page can be opened in Universal Editor.
    if (isProductPath && productSlug) {
      setContent(null);
      setEditorProp({
        'data-aue-resource': `urn:aemconnection:content/site/product/${productSlug}/jcr:content/data/master`,
        'data-aue-type': 'container',
        'data-aue-label': 'Product page',
      });
      return;
    }
    if (isProductPath) {
      setContent(null);
      setEditorProp({});
      return;
    }

    const randomNumber = Math.random().toString(36).substring(2, 15);
    const sdk = new AEMHeadless({
      serviceURL: aemEnv,
      endpoint: '/graphql/execute.json',
      fetch: ((resource, options = {}) => {
        if (resource.startsWith('https://author-'))
          options.credentials = 'include';
        return window.fetch(resource, options);
      })
    });

    // Build AEM content path. If URL is already the full path (e.g. /content/dam/v0/site/en/new-arrivals/new-arrivals), use it as-is.
    const isFullAemPath =
      slugSegments.length >= 5 &&
      slugSegments[0] === 'content' &&
      slugSegments[1] === 'dam' &&
      slugSegments[2] === aemProject &&
      slugSegments[3] === 'site';

    // Optional URL–locale mapping: if slug starts with a known locale (e.g. us/en), use it and treat the rest as content path.
    let localeForPath = storedLocale;
    let contentPathSegments = slugSegments;
    if (!isFullAemPath && slugSegments.length >= 2) {
      for (const segments of URL_LOCALE_SEGMENTS) {
        const matches = segments.length <= slugSegments.length &&
          segments.every((seg, i) => slugSegments[i] === seg);
        if (matches) {
          localeForPath = segments.join('/');
          contentPathSegments = slugSegments.slice(segments.length);
          if (contentPathSegments.length === 0) contentPathSegments = ['home', 'home'];
          localStorage.setItem('locale', localeForPath);
          break;
        }
      }
    }

    const path = isFullAemPath
      ? `/${slugSegments.join('/')}`
      : `/content/dam/${aemProject}/site/${localeForPath}/${contentPathSegments.join('/')}`;

    sdk.runPersistedQuery('v0/screenByPath', { path, variation: 'master', v1: randomNumber })
      .then(({ data }) => {
        if (data?.screenByPath?.item) {
          setContent(data.screenByPath.item);
          setEditorProp({
            'data-aue-resource': `urn:aemconnection:${data.screenByPath.item._path}/jcr:content/data/${data.screenByPath.item._variation}`,
            'data-aue-type': 'container',
            'data-aue-filter': 'screen',
            'data-aue-label': 'Screen',
            'data-aue-model': data.screenByPath.item._model?._path
          });
        }
      })
      .catch((error) => {
        console.log(`Error with screen request. ${error.message}`);
      });
  }, [resolvedParams, isProductPath]);

  useEffect(() => {
    if (!isProductPath || !productSlug || typeof window === 'undefined') {
      if (!isProductPath) setProductDetail(undefined);
      return;
    }
    setProductDetail(undefined);
    let cancelled = false;
    getProductWithVariants(productSlug)
      .then((data) => {
        if (!cancelled) setProductDetail(data ?? null);
      })
      .catch((err) => {
        if (!cancelled) setProductDetail(null);
        console.error('Product fetch error:', err);
      });
    return () => { cancelled = true; };
  }, [isProductPath, productSlug]);

  // Amplience PDP content (pdp/content/{SKU})
  useEffect(() => {
    if (!isProductPath || !productSlug || typeof window === 'undefined') {
      setProductPdp(null);
      return;
    }
    let cancelled = false;
    const key = `pdp/content/${String(productSlug).toUpperCase()}`;
    fetch(`/api/amplience/content?key=${encodeURIComponent(key)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        // API returns a single content item; page expects { active, content: array }
        if (data?.active && Array.isArray(data?.content)) {
          setProductPdp(data);
        } else if (data && typeof data === 'object' && (data._meta || data.deliveryId)) {
          setProductPdp({ active: true, content: [data] });
        } else {
          setProductPdp(null);
        }
      })
      .catch(() => { if (!cancelled) setProductPdp(null); });
    return () => { cancelled = true; };
  }, [isProductPath, productSlug]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (projectName) {
        localStorage.setItem('projectName', projectName);
      }
    }
  }, [projectName]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (aemEnvironment) {
        localStorage.setItem('aemEnvironment', aemEnvironment);
      }
    }
  }, [aemEnvironment]);

  return (
    <>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Top Utility Bar */}
        <div className="utility-bar">
          <Link href="#" className="hover:underline">
            Find a Store
          </Link>
          <Link href="#" className="hover:underline">
            Help
          </Link>
          <Link href="#" className="hover:underline">
            Join Us
          </Link>
          <AuthBar />
        </div>
        {/* Main Header/Navbar */}
        {config && (<MainNav config={config} />)}
        <main className="flex-1" {...editorProps}>
          {isProductPath ? (
            <>
              {/* Amplience PDP top slot */}
              {productSlug && (
                <AmplienceSlot
                  slotKey={`pdp/slot/${String(productSlug).toUpperCase()}/top`}
                  label="PDP top"
                />
              )}
              {/* Existing: Adobe Commerce product data via ProductDetail */}
              <ProductDetail
                variantData={productDetail}
                config={config}
                productSlug={productSlug}
              />
              {/* Amplience (from amplience-sfcc-composable-commerce): PDP content by key pdp/content/{SKU} */}
              {productPdp?.content?.map((item, i) => {
                const id = item?._meta?.deliveryId ?? item?.id;
                if (!id) return null;
                return (
                  <AmplienceWrapper
                    key={id}
                    fetch={{ id }}
                  />
                );
              })}
              {/* Amplience PDP bottom slot */}
              {productSlug && (
                <AmplienceSlot
                  slotKey={`pdp/slot/${String(productSlug).toUpperCase()}/bottom`}
                  label="PDP bottom"
                />
              )}
            </>
          ) : (
            content && content.block && (() => {
              const blocks = content.block;
              const categoryGridIndex = blocks.findIndex(
                (b) => b._model?.title && b._model.title.replace(/\s/g, '') === 'CategoryGrid'
              );
              const insertCarouselBefore = categoryGridIndex >= 0 ? categoryGridIndex : blocks.length;
              const slugSegments = resolvedParams?.slug || [];
              const pageSlug = slugSegments[0] === 'content' ? slugSegments.slice(-2).join('/') : slugSegments.join('/') || 'page';
              const slotBase = `slug/${pageSlug}/body/slot`;
              return (
                <>
                  {blocks.map((block, n) => (
                    <Fragment key={n}>
                      <AmplienceSlot
                        slotKey={`${slotBase}/${n}`}
                        label={`Slot ${n + 1}`}
                      />
                      <div
                        className="block-container"
                        data-aue-resource={`urn:aemconnection:${block?._path}/jcr:content/data/${block?._variation}`}
                        data-aue-type="component"
                        data-aue-label={block?._model?.title ?? 'Block'}
                        data-aue-model={block?._model?._path}
                      >
                        {n === insertCarouselBefore && (
                          <Suspense fallback={<div className="min-h-[200px]" />}>
                            <EditableCarousel />
                          </Suspense>
                        )}
                        <ModelManager content={block} config={config} />
                      </div>
                    </Fragment>
                  ))}
                  <AmplienceSlot
                    slotKey={`${slotBase}/${blocks.length}`}
                    label={`Slot ${blocks.length + 1}`}
                  />
                </>
              );
            })()
          )}
          {/* <ProductListPage /> */}
        </main>
        <Footer />
        <Modal isOpen={showModal} onClose={handleCloseModal}>
          <h2>Configure Project</h2>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="modal-form-group">
              <label htmlFor="aemEnvironment">AEM Environment:</label>
              <input
                type="text"
                id="aemEnvironment"
                value={aemEnvironment}
                onChange={(e) => setAemEnvironment(e.target.value)}
                required
              />
            </div>
            <div className="modal-form-group">
              <label htmlFor="projectName">Project Name:</label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
            </div>
            <div className="modal-form-actions">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Modal>
      </div>
    </>
  )
}