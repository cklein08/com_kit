"use client";
import { useState, useEffect, Suspense, Fragment } from 'react'
import Link from "next/link"
import Script from 'next/script';
import Head from 'next/head';
import { MainNav } from "@/components/main-nav"
import { AuthBar } from "@/components/auth-bar"
import { ModelManager } from "@/components/model-manager"
import { Footer } from "@/components/footer"
import { Modal } from "@/components/modal/modal" // Import the new Modal component
import { Button } from "@/components/button"
import AEMHeadless from '@adobe/aem-headless-client-js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EditableCarousel } from "@/components/running-shoes-carousel/editable-carousel";
import { AmplienceSlot } from "@/components/amplience/drop-zone";
import { UE_CORS_SCRIPT_URL, DEFAULT_AEM_EDITOR_URL, DEFAULT_AEM_PROJECT } from "@/lib/constants";


export default function Component() {
  const [aemEnvironment, setAemEnvironment] = useState('');
  const [projectName, setProjectName] = useState('');
  const [config, setConfig] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [editorProps, setEditorProp] = useState({});
  const [locale, setLocale] = useState('en');
  const [content, setContent] = useState(null);
  const [contentLoadAttempted, setContentLoadAttempted] = useState(false);

  const handleCloseModal = () => {
    setShowModal(false)
  }

  const handleSubmit = (e) => { }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedAemEnv = localStorage.getItem('aemEnvironment');
      const storedProjectName = localStorage.getItem('projectName');
      const isInUniversalEditor = window.self !== window.top;

      const aemEnv = storedAemEnv || (isInUniversalEditor ? DEFAULT_AEM_EDITOR_URL : '');
      const aemProject = storedProjectName || (isInUniversalEditor ? DEFAULT_AEM_PROJECT : '');

      setAemEnvironment(storedAemEnv || '');
      setProjectName(storedProjectName || '');

      if (!aemEnv || !aemProject) {
        if (!isInUniversalEditor) setShowModal(true);
        setContentLoadAttempted(false);
        return;
      }
      setConfig({
        env: aemEnv,
        project: aemProject,
      });
      setContent(null);
      setContentLoadAttempted(false);
      const randomNumber = Math.random().toString(36).substring(2, 15)
      // const graphqlEndpoint = `${aemEnvironment}/graphql/execute.json/${projectName}/screenByPath;path=/content/dam/v0/home/home;variation=master?_=${randomNumber}`

      const sdk = new AEMHeadless({
        serviceURL: aemEnv,
        endpoint: '/graphql/execute.json',
        fetch: ((resource, options = {}) => {
          if (resource.startsWith('https://author-'))
            options.credentials = 'include';
          return window.fetch(resource, options);
        })
      });

      sdk.runPersistedQuery('v0/screenByPath', { path: `/content/dam/${aemProject}/site/${locale}/home/home`, variation: `master`, v1: randomNumber })
        .then(({ data }) => {
          setContentLoadAttempted(true);
          if (data) {
            setContent(data?.screenByPath?.item);
            setEditorProp({
              'data-aue-resource': `urn:aemconnection:${data?.screenByPath?.item?._path}/jcr:content/data/${data?.screenByPath?.item?._variation}`,
              'data-aue-type': 'container',
              'data-aue-filter': 'screen',
              'data-aue-label': 'Screen',
              'data-aue-model': data?.screenByPath?.item?._model?._path
            });
          }
        })
        .catch((error) => {
          setContentLoadAttempted(true);
          console.log(`Error with screen request. ${error.message}`);
        });
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (locale) {
        localStorage.setItem('locale', locale);
      }
    }
  }, [locale]);

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
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Top Utility Bar */}
        <div className="utility-bar">
          {/* Category Filter */}
          <Select
            value={locale}
            onValueChange={setLocale}
          >
            <SelectTrigger className="w-[100px] h-[30px] text-xs">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
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
        {config && (<MainNav config={config} locale={locale} />)}
        <main className="flex-1" {...editorProps}>
          {(() => {
            const hasContent = content && content.block && content.block.length > 0;
            if (hasContent) {
              const blocks = content.block;
              const categoryGridIndex = blocks.findIndex(
                (b) => b._model?.title && b._model.title.replace(/\s/g, "") === "CategoryGrid"
              );
              const insertCarouselBefore = categoryGridIndex >= 0 ? categoryGridIndex : blocks.length;
              return (
                <>
                  {blocks.map((block, n) => (
                    <Fragment key={n}>
                      <AmplienceSlot
                        slotKey={`home/body/slot/${n}`}
                        label={`Slot ${n + 1}`}
                      />
                      <div
                        className="block-container"
                        data-aue-resource={`urn:aemconnection:${block?._path}/jcr:content/data/${block?._variation}`}
                        data-aue-type="component"
                        data-aue-label={block?._model?.title ?? "Block"}
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
                    slotKey={`home/body/slot/${blocks.length}`}
                    label={`Slot ${blocks.length + 1}`}
                  />
                </>
              );
            }
            const configMissing = !aemEnvironment || !projectName;
            if (configMissing) {
              return (
                <div className="no-content-message">
                  <p>No content available. Please check your AEM configuration or try again later.</p>
                  <p>
                    {aemEnvironment
                      ? `AEM Environment: ${aemEnvironment} has been defined`
                      : 'AEM Environment has not been set'}
                  </p>
                  <p>
                    {projectName
                      ? `Project Name: ${projectName} has been defined`
                      : 'Project Name has not been set'}
                  </p>
                </div>
              );
            }
            if (!contentLoadAttempted) {
              return null;
            }
            return (
              <div className="no-content-message">
                <p>No content available. Please check your AEM configuration or try again later.</p>
              </div>
            );
          })()}
        </main>
        <Footer />
        <Modal isOpen={showModal} onClose={handleCloseModal}>
          <h2>Configure Project</h2>
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="modal-form-group">
              <label htmlFor="aemEnvironment">AEM Environment: </label>
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
