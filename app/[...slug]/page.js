"use client"
import { useRouter } from 'next/navigation'
import { use, useState, useEffect } from 'react'
import Link from "next/link"
import Script from 'next/script';
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
import { getProductWithVariants } from "@/lib/api/plp"
import { UE_CORS_SCRIPT_URL } from "@/lib/constants"

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

    setAemEnvironment(storedAemEnv || '');
    setProjectName(storedProjectName || '');

    if (!storedAemEnv || !storedProjectName) {
      setShowModal(true);
      return;
    }
    setConfig({
      env: storedAemEnv,
      project: storedProjectName,
    });

    // Don't fetch screen content for product detail routes
    if (isProductPath) {
      setContent(null);
      setEditorProp({});
      return;
    }

    const randomNumber = Math.random().toString(36).substring(2, 15);
    const sdk = new AEMHeadless({
      serviceURL: storedAemEnv,
      endpoint: '/graphql/execute.json',
      fetch: ((resource, options = {}) => {
        if (resource.startsWith('https://author-'))
          options.credentials = 'include';
        return window.fetch(resource, options);
      })
    });

    // Build AEM content path. If URL is already the full path (e.g. /content/dam/v0/site/en/new-arrivals/new-arrivals), use it as-is.
    const slugSegments = resolvedParams?.slug?.length ? resolvedParams.slug : ['home', 'home'];
    const isFullAemPath =
      slugSegments.length >= 5 &&
      slugSegments[0] === 'content' &&
      slugSegments[1] === 'dam' &&
      slugSegments[2] === storedProjectName &&
      slugSegments[3] === 'site';
    const path = isFullAemPath
      ? `/${slugSegments.join('/')}`
      : `/content/dam/${storedProjectName}/site/${storedLocale}/${slugSegments.join('/')}`;

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
        if (data?.active && Array.isArray(data?.content)) setProductPdp(data);
        else setProductPdp(null);
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
      <Script src={UE_CORS_SCRIPT_URL} async />
      <div className="flex flex-col min-h-screen bg-white text-gray-900">
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
              {/* Existing: Adobe Commerce product data via ProductDetail */}
              <ProductDetail variantData={productDetail} />
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
            </>
          ) : (
            content && content.block.map((block, n) => {
              const blockEditorProps = {
                'data-aue-resource': `urn:aemconnection:${block?._path}/jcr:content/data/${block?._variation}`,
                'data-aue-type': 'component',
                'data-aue-label': block?._model?.title ?? 'Block',
                'data-aue-model': block?._model?._path,
              };
              return (
                <div key={n} className="block-container" {...blockEditorProps}>
                  <ModelManager key={n} content={block} config={config} />
                </div>
              );
            })
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