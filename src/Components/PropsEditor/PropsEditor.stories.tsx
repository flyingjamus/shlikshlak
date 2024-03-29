import { findJSXElementByPosition, PropsEditor } from './PropsEditor'
import { PanelsResponse } from '../../Shared/PanelTypes'
import { getOrCreateModelAndSubdoc, watchYjsString } from '../UseYjs'
import * as Y from 'yjs'
import { getSubdoc } from '../GetSubdoc'
import { useMemo } from 'react'
import nextjsIndex from '../../../integration/nextjs/src/pages/index.tsx?raw'
import { panelsResponseSchema } from '../../Shared/PanelTypesZod'

const value: panelsResponseSchema = {
  attributes: [
    {
      name: 'key',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'crossOrigin',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['', 'anonymous', 'use-credentials'],
          },
        },
      ],
    },
    {
      name: 'decoding',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['async', 'auto', 'sync'],
          },
        },
      ],
    },
    {
      name: 'referrerPolicy',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: [
              '',
              'no-referrer',
              'no-referrer-when-downgrade',
              'origin',
              'origin-when-cross-origin',
              'same-origin',
              'strict-origin',
              'strict-origin-when-cross-origin',
              'unsafe-url',
            ],
          },
        },
      ],
    },
    {
      name: 'sizes',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'useMap',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'defaultChecked',
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'defaultValue',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'suppressContentEditableWarning',
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'suppressHydrationWarning',
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'accessKey',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'autoFocus',
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'className',
      location: {
        pos: 1321,
        end: 1357,
      },
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'contentEditable',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'inherit', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'contextMenu',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'dir',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'draggable',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'hidden',
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'id',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'lang',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'nonce',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'placeholder',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['blur', 'empty'],
          },
        },
      ],
    },
    {
      name: 'slot',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'spellCheck',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'style',
      panels: [],
    },
    {
      name: 'tabIndex',
      panels: [],
    },
    {
      name: 'title',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'translate',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['no', 'yes'],
          },
        },
      ],
    },
    {
      name: 'radioGroup',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'role',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: [
              'alert',
              'alertdialog',
              'application',
              'article',
              'banner',
              'button',
              'cell',
              'checkbox',
              'columnheader',
              'combobox',
              'complementary',
              'contentinfo',
              'definition',
              'dialog',
              'directory',
              'document',
              'feed',
              'figure',
              'form',
              'grid',
              'gridcell',
              'group',
              'heading',
              'img',
              'link',
              'list',
              'listbox',
              'listitem',
              'log',
              'main',
              'marquee',
              'math',
              'menu',
              'menubar',
              'menuitem',
              'menuitemcheckbox',
              'menuitemradio',
              'navigation',
              'none',
              'note',
              'option',
              'presentation',
              'progressbar',
              'radio',
              'radiogroup',
              'region',
              'row',
              'rowgroup',
              'rowheader',
              'scrollbar',
              'search',
              'searchbox',
              'separator',
              'slider',
              'spinbutton',
              'status',
              'switch',
              'tab',
              'table',
              'tablist',
              'tabpanel',
              'term',
              'textbox',
              'timer',
              'toolbar',
              'tooltip',
              'tree',
              'treegrid',
              'treeitem',
            ],
          },
        },
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'about',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'content',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'datatype',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'inlist',
      panels: [
        {
          name: 'string',
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'prefix',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'property',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'rel',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'resource',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'rev',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'typeof',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'vocab',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'autoCapitalize',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'autoCorrect',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'autoSave',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'color',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'itemProp',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'itemScope',
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'itemType',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'itemID',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'itemRef',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'results',
      panels: [],
    },
    {
      name: 'security',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'unselectable',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['off', 'on'],
          },
        },
      ],
    },
    {
      name: 'inputMode',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['decimal', 'email', 'none', 'numeric', 'search', 'tel', 'text', 'url'],
          },
        },
      ],
    },
    {
      name: 'is',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'tw',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-activedescendant',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-atomic',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-autocomplete',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['both', 'inline', 'list', 'none'],
          },
        },
      ],
    },
    {
      name: 'aria-busy',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-checked',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'mixed', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-colcount',
      panels: [],
    },
    {
      name: 'aria-colindex',
      panels: [],
    },
    {
      name: 'aria-colspan',
      panels: [],
    },
    {
      name: 'aria-controls',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-current',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['date', 'false', 'location', 'page', 'step', 'time', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-describedby',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-details',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-disabled',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-dropeffect',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['copy', 'execute', 'link', 'move', 'none', 'popup'],
          },
        },
      ],
    },
    {
      name: 'aria-errormessage',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-expanded',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-flowto',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-grabbed',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-haspopup',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['dialog', 'false', 'grid', 'listbox', 'menu', 'tree', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-hidden',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-invalid',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'grammar', 'spelling', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-keyshortcuts',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-label',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-labelledby',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-level',
      panels: [],
    },
    {
      name: 'aria-live',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['assertive', 'off', 'polite'],
          },
        },
      ],
    },
    {
      name: 'aria-modal',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-multiline',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-multiselectable',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-orientation',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['horizontal', 'vertical'],
          },
        },
      ],
    },
    {
      name: 'aria-owns',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-placeholder',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-posinset',
      panels: [],
    },
    {
      name: 'aria-pressed',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'mixed', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-readonly',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-relevant',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: [
              'additions',
              'additions removals',
              'additions text',
              'all',
              'removals',
              'removals additions',
              'removals text',
              'text',
              'text additions',
              'text removals',
            ],
          },
        },
      ],
    },
    {
      name: 'aria-required',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-roledescription',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'aria-rowcount',
      panels: [],
    },
    {
      name: 'aria-rowindex',
      panels: [],
    },
    {
      name: 'aria-rowspan',
      panels: [],
    },
    {
      name: 'aria-selected',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['false', 'true'],
          },
        },
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'aria-setsize',
      panels: [],
    },
    {
      name: 'aria-sort',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['ascending', 'descending', 'none', 'other'],
          },
        },
      ],
    },
    {
      name: 'aria-valuemax',
      panels: [],
    },
    {
      name: 'aria-valuemin',
      panels: [],
    },
    {
      name: 'aria-valuenow',
      panels: [],
    },
    {
      name: 'aria-valuetext',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'children',
      location: {
        pos: 1304,
        end: 1507,
      },
      panels: [
        {
          name: 'Children',
        },
      ],
    },
    {
      name: 'dangerouslySetInnerHTML',
      panels: [],
    },
    {
      name: 'onCopy',
      panels: [],
    },
    {
      name: 'onCopyCapture',
      panels: [],
    },
    {
      name: 'onCut',
      panels: [],
    },
    {
      name: 'onCutCapture',
      panels: [],
    },
    {
      name: 'onPaste',
      panels: [],
    },
    {
      name: 'onPasteCapture',
      panels: [],
    },
    {
      name: 'onCompositionEnd',
      panels: [],
    },
    {
      name: 'onCompositionEndCapture',
      panels: [],
    },
    {
      name: 'onCompositionStart',
      panels: [],
    },
    {
      name: 'onCompositionStartCapture',
      panels: [],
    },
    {
      name: 'onCompositionUpdate',
      panels: [],
    },
    {
      name: 'onCompositionUpdateCapture',
      panels: [],
    },
    {
      name: 'onFocus',
      panels: [],
    },
    {
      name: 'onFocusCapture',
      panels: [],
    },
    {
      name: 'onBlur',
      panels: [],
    },
    {
      name: 'onBlurCapture',
      panels: [],
    },
    {
      name: 'onChange',
      panels: [],
    },
    {
      name: 'onChangeCapture',
      panels: [],
    },
    {
      name: 'onBeforeInput',
      panels: [],
    },
    {
      name: 'onBeforeInputCapture',
      panels: [],
    },
    {
      name: 'onInput',
      panels: [],
    },
    {
      name: 'onInputCapture',
      panels: [],
    },
    {
      name: 'onReset',
      panels: [],
    },
    {
      name: 'onResetCapture',
      panels: [],
    },
    {
      name: 'onSubmit',
      panels: [],
    },
    {
      name: 'onSubmitCapture',
      panels: [],
    },
    {
      name: 'onInvalid',
      panels: [],
    },
    {
      name: 'onInvalidCapture',
      panels: [],
    },
    {
      name: 'onLoad',
      panels: [],
    },
    {
      name: 'onLoadCapture',
      panels: [],
    },
    {
      name: 'onError',
      panels: [],
    },
    {
      name: 'onErrorCapture',
      panels: [],
    },
    {
      name: 'onKeyDown',
      panels: [],
    },
    {
      name: 'onKeyDownCapture',
      panels: [],
    },
    {
      name: 'onKeyPress',
      panels: [],
    },
    {
      name: 'onKeyPressCapture',
      panels: [],
    },
    {
      name: 'onKeyUp',
      panels: [],
    },
    {
      name: 'onKeyUpCapture',
      panels: [],
    },
    {
      name: 'onAbort',
      panels: [],
    },
    {
      name: 'onAbortCapture',
      panels: [],
    },
    {
      name: 'onCanPlay',
      panels: [],
    },
    {
      name: 'onCanPlayCapture',
      panels: [],
    },
    {
      name: 'onCanPlayThrough',
      panels: [],
    },
    {
      name: 'onCanPlayThroughCapture',
      panels: [],
    },
    {
      name: 'onDurationChange',
      panels: [],
    },
    {
      name: 'onDurationChangeCapture',
      panels: [],
    },
    {
      name: 'onEmptied',
      panels: [],
    },
    {
      name: 'onEmptiedCapture',
      panels: [],
    },
    {
      name: 'onEncrypted',
      panels: [],
    },
    {
      name: 'onEncryptedCapture',
      panels: [],
    },
    {
      name: 'onEnded',
      panels: [],
    },
    {
      name: 'onEndedCapture',
      panels: [],
    },
    {
      name: 'onLoadedData',
      panels: [],
    },
    {
      name: 'onLoadedDataCapture',
      panels: [],
    },
    {
      name: 'onLoadedMetadata',
      panels: [],
    },
    {
      name: 'onLoadedMetadataCapture',
      panels: [],
    },
    {
      name: 'onLoadStart',
      panels: [],
    },
    {
      name: 'onLoadStartCapture',
      panels: [],
    },
    {
      name: 'onPause',
      panels: [],
    },
    {
      name: 'onPauseCapture',
      panels: [],
    },
    {
      name: 'onPlay',
      panels: [],
    },
    {
      name: 'onPlayCapture',
      panels: [],
    },
    {
      name: 'onPlaying',
      panels: [],
    },
    {
      name: 'onPlayingCapture',
      panels: [],
    },
    {
      name: 'onProgress',
      panels: [],
    },
    {
      name: 'onProgressCapture',
      panels: [],
    },
    {
      name: 'onRateChange',
      panels: [],
    },
    {
      name: 'onRateChangeCapture',
      panels: [],
    },
    {
      name: 'onResize',
      panels: [],
    },
    {
      name: 'onResizeCapture',
      panels: [],
    },
    {
      name: 'onSeeked',
      panels: [],
    },
    {
      name: 'onSeekedCapture',
      panels: [],
    },
    {
      name: 'onSeeking',
      panels: [],
    },
    {
      name: 'onSeekingCapture',
      panels: [],
    },
    {
      name: 'onStalled',
      panels: [],
    },
    {
      name: 'onStalledCapture',
      panels: [],
    },
    {
      name: 'onSuspend',
      panels: [],
    },
    {
      name: 'onSuspendCapture',
      panels: [],
    },
    {
      name: 'onTimeUpdate',
      panels: [],
    },
    {
      name: 'onTimeUpdateCapture',
      panels: [],
    },
    {
      name: 'onVolumeChange',
      panels: [],
    },
    {
      name: 'onVolumeChangeCapture',
      panels: [],
    },
    {
      name: 'onWaiting',
      panels: [],
    },
    {
      name: 'onWaitingCapture',
      panels: [],
    },
    {
      name: 'onAuxClick',
      panels: [],
    },
    {
      name: 'onAuxClickCapture',
      panels: [],
    },
    {
      name: 'onClick',
      panels: [],
    },
    {
      name: 'onClickCapture',
      panels: [],
    },
    {
      name: 'onContextMenu',
      panels: [],
    },
    {
      name: 'onContextMenuCapture',
      panels: [],
    },
    {
      name: 'onDoubleClick',
      panels: [],
    },
    {
      name: 'onDoubleClickCapture',
      panels: [],
    },
    {
      name: 'onDrag',
      panels: [],
    },
    {
      name: 'onDragCapture',
      panels: [],
    },
    {
      name: 'onDragEnd',
      panels: [],
    },
    {
      name: 'onDragEndCapture',
      panels: [],
    },
    {
      name: 'onDragEnter',
      panels: [],
    },
    {
      name: 'onDragEnterCapture',
      panels: [],
    },
    {
      name: 'onDragExit',
      panels: [],
    },
    {
      name: 'onDragExitCapture',
      panels: [],
    },
    {
      name: 'onDragLeave',
      panels: [],
    },
    {
      name: 'onDragLeaveCapture',
      panels: [],
    },
    {
      name: 'onDragOver',
      panels: [],
    },
    {
      name: 'onDragOverCapture',
      panels: [],
    },
    {
      name: 'onDragStart',
      panels: [],
    },
    {
      name: 'onDragStartCapture',
      panels: [],
    },
    {
      name: 'onDrop',
      panels: [],
    },
    {
      name: 'onDropCapture',
      panels: [],
    },
    {
      name: 'onMouseDown',
      panels: [],
    },
    {
      name: 'onMouseDownCapture',
      panels: [],
    },
    {
      name: 'onMouseEnter',
      panels: [],
    },
    {
      name: 'onMouseLeave',
      panels: [],
    },
    {
      name: 'onMouseMove',
      panels: [],
    },
    {
      name: 'onMouseMoveCapture',
      panels: [],
    },
    {
      name: 'onMouseOut',
      panels: [],
    },
    {
      name: 'onMouseOutCapture',
      panels: [],
    },
    {
      name: 'onMouseOver',
      panels: [],
    },
    {
      name: 'onMouseOverCapture',
      panels: [],
    },
    {
      name: 'onMouseUp',
      panels: [],
    },
    {
      name: 'onMouseUpCapture',
      panels: [],
    },
    {
      name: 'onSelect',
      panels: [],
    },
    {
      name: 'onSelectCapture',
      panels: [],
    },
    {
      name: 'onTouchCancel',
      panels: [],
    },
    {
      name: 'onTouchCancelCapture',
      panels: [],
    },
    {
      name: 'onTouchEnd',
      panels: [],
    },
    {
      name: 'onTouchEndCapture',
      panels: [],
    },
    {
      name: 'onTouchMove',
      panels: [],
    },
    {
      name: 'onTouchMoveCapture',
      panels: [],
    },
    {
      name: 'onTouchStart',
      panels: [],
    },
    {
      name: 'onTouchStartCapture',
      panels: [],
    },
    {
      name: 'onPointerDown',
      panels: [],
    },
    {
      name: 'onPointerDownCapture',
      panels: [],
    },
    {
      name: 'onPointerMove',
      panels: [],
    },
    {
      name: 'onPointerMoveCapture',
      panels: [],
    },
    {
      name: 'onPointerUp',
      panels: [],
    },
    {
      name: 'onPointerUpCapture',
      panels: [],
    },
    {
      name: 'onPointerCancel',
      panels: [],
    },
    {
      name: 'onPointerCancelCapture',
      panels: [],
    },
    {
      name: 'onPointerEnter',
      panels: [],
    },
    {
      name: 'onPointerEnterCapture',
      panels: [],
    },
    {
      name: 'onPointerLeave',
      panels: [],
    },
    {
      name: 'onPointerLeaveCapture',
      panels: [],
    },
    {
      name: 'onPointerOver',
      panels: [],
    },
    {
      name: 'onPointerOverCapture',
      panels: [],
    },
    {
      name: 'onPointerOut',
      panels: [],
    },
    {
      name: 'onPointerOutCapture',
      panels: [],
    },
    {
      name: 'onGotPointerCapture',
      panels: [],
    },
    {
      name: 'onGotPointerCaptureCapture',
      panels: [],
    },
    {
      name: 'onLostPointerCapture',
      panels: [],
    },
    {
      name: 'onLostPointerCaptureCapture',
      panels: [],
    },
    {
      name: 'onScroll',
      panels: [],
    },
    {
      name: 'onScrollCapture',
      panels: [],
    },
    {
      name: 'onWheel',
      panels: [],
    },
    {
      name: 'onWheelCapture',
      panels: [],
    },
    {
      name: 'onAnimationStart',
      panels: [],
    },
    {
      name: 'onAnimationStartCapture',
      panels: [],
    },
    {
      name: 'onAnimationEnd',
      panels: [],
    },
    {
      name: 'onAnimationEndCapture',
      panels: [],
    },
    {
      name: 'onAnimationIteration',
      panels: [],
    },
    {
      name: 'onAnimationIterationCapture',
      panels: [],
    },
    {
      name: 'onTransitionEnd',
      panels: [],
    },
    {
      name: 'onTransitionEndCapture',
      panels: [],
    },
    {
      name: 'src',
      location: {
        pos: 1357,
        end: 1385,
      },
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'alt',
      location: {
        pos: 1385,
        end: 1416,
      },
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'width',
      location: {
        pos: 1416,
        end: 1440,
      },
      panels: [],
    },
    {
      name: 'height',
      location: {
        pos: 1440,
        end: 1464,
      },
      panels: [],
    },
    {
      name: 'fill',
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'loader',
      panels: [],
    },
    {
      name: 'quality',
      panels: [],
    },
    {
      name: 'priority',
      location: {
        pos: 1464,
        end: 1485,
      },
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'loading',
      panels: [
        {
          name: 'enum',
          parameters: {
            values: ['eager', 'lazy'],
          },
        },
      ],
    },
    {
      name: 'blurDataURL',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'unoptimized',
      panels: [
        {
          name: 'boolean',
        },
      ],
    },
    {
      name: 'onLoadingComplete',
      panels: [],
    },
    {
      name: 'layout',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'objectFit',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'objectPosition',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'lazyBoundary',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'lazyRoot',
      panels: [
        {
          name: 'string',
        },
      ],
    },
    {
      name: 'ref',
      panels: [],
    },
  ],
  existingAttributes: [
    {
      name: 'className',
      value: '{styles.logo}',
      hasInitializer: true,
      location: {
        pos: 1321,
        end: 1357,
      },
      panels: ['string'],
    },
    {
      name: 'src',
      value: '"/next.svg"',
      hasInitializer: true,
      location: {
        pos: 1357,
        end: 1385,
      },
      panels: ['string'],
    },
    {
      name: 'alt',
      value: '"Next.js Logo"',
      hasInitializer: true,
      location: {
        pos: 1385,
        end: 1416,
      },
      panels: ['string'],
    },
    {
      name: 'width',
      value: '{180}',
      hasInitializer: true,
      location: {
        pos: 1416,
        end: 1440,
      },
      panels: [],
    },
    {
      name: 'height',
      value: '{37}',
      hasInitializer: true,
      location: {
        pos: 1440,
        end: 1464,
      },
      panels: [],
    },
    {
      name: 'priority',
      value: true,
      hasInitializer: false,
      location: {
        pos: 1464,
        end: 1485,
      },
      panels: [],
    },
    {
      name: 'children',
      location: {
        pos: 1304,
        end: 1507,
      },
      value:
        '<Image\n            className={styles.logo}\n            src="/next.svg"\n            alt="Next.js Logo"\n            width={180}\n            height={37}\n            priority\n          />',
      panels: [],
    },
  ],
  location: 1315,
  fileName: '/home/danny/dev/shlikshlak/integration/nextjs/src/pages/index.tsx',
  range: {
    startColumn: 12,
    startLineNumber: 42,
    endColumn: 13,
    endLineNumber: 49,
  },
}

const doc = new Y.Doc()
export const One = () => {
  const subDoc = useMemo(() => {
    const subDoc = getSubdoc(doc, 'document.tsx')
    subDoc.getText().insert(0, nextjsIndex)
    return subDoc
  }, [])
  const text = watchYjsString(subDoc.getText())
  const element = useMemo(() => {
    return findJSXElementByPosition(text, value.range.startLineNumber, value.range.startColumn)!
  }, [text])
  return (
    <PropsEditor
      panels={value}
      onAttributeChange={async (attr, v) => {
        console.log('onAttributeChange', attr, v)
      }}
      onBlur={() => {}}
      element={element}
      doc={subDoc}
      text={subDoc.getText()}
    />
  )
}

export const Boolean = () => {
  return (
    <PropsEditor
      panels={
        {
          attributes: [
            {
              name: 'dense',
              location: {
                pos: 8332,
                end: 8338,
              },
              panels: [
                {
                  name: 'boolean',
                },
              ],
            },
          ],
          existingAttributes: [
            {
              name: 'dense',
              hasInitializer: false,
              location: {
                pos: 8332,
                end: 8338,
              },
              value: true,
              panels: ['boolean'],
            },
          ],
          location: 8298,
          fileName: '/home/danny/dev/shlikshlak/src/Components/PropsEditor/PropsEditor.tsx',
          range: {
            startColumn: 10,
            startLineNumber: 305,
            endColumn: 66,
            endLineNumber: 305,
          },
        } as PanelsResponse
      }
      onAttributeChange={async (attr, v) => {
        console.log('onAttributeChange', attr, v)
      }}
      onBlur={() => {}}
    />
  )
}

export const StringExpression = () => {
  return (
    <PropsEditor
      panels={
        {
          attributes: [
            {
              name: 'disabled',
              location: {
                pos: 11710,
                end: 11758,
              },
              panels: [
                {
                  name: 'boolean',
                },
              ],
            },
          ],
          existingAttributes: [
            {
              name: 'disabled',
              value: '{innerValue === undefined}',
              hasInitializer: true,
              location: {
                pos: 11710,
                end: 11758,
              },
              panels: [],
            },
          ],
          location: 11642,
          fileName: '/home/danny/dev/shlikshlak/src/Components/PropsEditor/PropsEditor.tsx',
          range: {
            startColumn: 12,
            startLineNumber: 428,
            endColumn: 13,
            endLineNumber: 437,
          },
        } as PanelsResponse
      }
      onAttributeChange={async (attr, v) => {
        console.log('onAttributeChange', attr, v)
      }}
      onBlur={() => {}}
    />
  )
}
