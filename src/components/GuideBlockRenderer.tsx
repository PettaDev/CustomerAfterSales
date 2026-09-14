import { useState } from 'react'
import { AlertTriangle, Check, CheckCircle2, Clipboard, Copy, Download, ExternalLink, FileArchive, Info, Maximize2, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { GuideBlock } from '../types'

interface Props {
  block: GuideBlock
  acknowledged: boolean
  onAcknowledged: (value: boolean) => void
  onOpenImage: (image: { src: string; alt: string }) => void
}

export function GuideBlockRenderer({ block, acknowledged, onAcknowledged, onOpenImage }: Props) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  if (block.type === 'code') {
    const copy = async () => {
      await navigator.clipboard.writeText(block.code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    }
    return (
      <div className="code-block">
        <div className="code-toolbar"><span><Clipboard size={15} />{block.labelKey ? t(block.labelKey) : t('guide.labels.command')}</span><button type="button" onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{t(copied ? 'actions.copied' : 'actions.copy')}</button></div>
        <pre><code>{block.code}</code></pre>
      </div>
    )
  }

  if (block.type === 'download') {
    return (
      <div className="download-card">
        <div className="download-icon"><FileArchive size={28} /></div>
        <div className="download-content">
          <span className="download-kicker"><ShieldCheck size={15} />{t('guide.notices.official.title')}</span>
          <h3>{t(block.titleKey)}</h3>
          <p>{t(block.descriptionKey)}</p>
          <dl>
            <div><dt>{t('guide.labels.version')}</dt><dd>{block.version}</dd></div>
            <div><dt>{t('guide.labels.size')}</dt><dd>{block.size}</dd></div>
            <div><dt>{t('guide.labels.file')}</dt><dd>{block.fileName}</dd></div>
            {block.checksum && <div><dt>{t('guide.labels.checksum')}</dt><dd>{block.checksum}</dd></div>}
          </dl>
          <div className="download-actions">
            <a className="primary-button" href={block.url} target="_blank" rel="noreferrer"><Download size={17} />{t(block.buttonKey)}</a>
            {block.releaseNotes && <a className="secondary-button" href={block.releaseNotes} target="_blank" rel="noreferrer">{t('actions.releaseNotes')}<ExternalLink size={15} /></a>}
          </div>
          {block.acknowledgmentKey && (
            <label className="acknowledgment"><input type="checkbox" checked={acknowledged} onChange={(event) => onAcknowledged(event.target.checked)} /><span className="custom-checkbox"><Check size={13} /></span><span>{t(block.acknowledgmentKey)}</span></label>
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'checklist') {
    return <ul className="instruction-list">{block.itemKeys.map((item) => <li key={item}><span><Check size={14} /></span>{t(item)}</li>)}</ul>
  }

  if (block.type === 'image') {
    const alt = t(block.altKey)
    return (
      <figure className="guide-image">
        <button type="button" onClick={() => onOpenImage({ src: block.src, alt })} aria-label={t('actions.openImage')}><img src={block.src} alt={alt} /><span><Maximize2 size={17} /></span></button>
        {block.captionKey && <figcaption>{t(block.captionKey)}</figcaption>}
      </figure>
    )
  }

  if (block.type === 'gallery') {
    return (
      <div className="guide-gallery">
        {block.images.map((item) => {
          const alt = t(item.altKey)
          return (
            <figure className="guide-image" key={item.src + item.altKey}>
              <button type="button" onClick={() => onOpenImage({ src: item.src, alt })} aria-label={t('actions.openImage')}><img src={item.src} alt={alt} /><span><Maximize2 size={17} /></span></button>
              {item.captionKey && <figcaption>{t(item.captionKey)}</figcaption>}
            </figure>
          )
        })}
      </div>
    )
  }

  if (block.type === 'video') {
    const title = t(block.titleKey)
    return (
      <div className={'video-frame' + (block.portrait ? ' is-portrait' : '')}>
        {block.src
          ? <video src={block.src} title={title} aria-label={title} controls playsInline preload="metadata" />
          : <iframe src={block.url} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />}
      </div>
    )
  }

  const noticeIcon = block.type === 'warning' ? <AlertTriangle size={20} /> : block.type === 'success' ? <CheckCircle2 size={20} /> : <Info size={20} />
  return (
    <div className={'notice-block ' + block.type}>
      <span className="notice-icon">{noticeIcon}</span>
      <div><strong>{t(block.titleKey)}</strong><p>{t(block.descriptionKey)}</p></div>
    </div>
  )
}
