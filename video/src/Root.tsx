import React from 'react';
import { Composition } from 'remotion';
import { Ad, DURATION } from './Ad';
import { LANGS } from './i18n';

// Une composition par langue : Glaciora-fr, Glaciora-de, Glaciora-sk, Glaciora-it (vertical 1080 × 1920, 30 i/s, sans son).
export const Root: React.FC = () => (
  <>
    {LANGS.map((lang) => (
      <Composition key={lang} id={`Glaciora-${lang}`} component={Ad} durationInFrames={DURATION} fps={30} width={1080} height={1920} defaultProps={{ lang }} />
    ))}
  </>
);
