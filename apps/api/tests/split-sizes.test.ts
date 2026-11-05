import { splitSizes } from '../src/modules/catalogue-import/import.service';

describe('splitSizes (tailles du fichier catalogue)', () => {
  it('garde les virgules décimales entre parenthèses', () => {
    expect(splitSizes('S (52-55,5 cm),M (55,5-59 cm),L (59-62,5 cm)')).toEqual(['S (52-55,5 cm)', 'M (55,5-59 cm)', 'L (59-62,5 cm)']);
  });

  it('découpe les pointures à décimale avec point', () => {
    expect(splitSizes('25.5, 26.5,27.5')).toEqual(['25.5', '26.5', '27.5']);
  });

  it('ignore les éléments vides', () => {
    expect(splitSizes('Taille unique,,')).toEqual(['Taille unique']);
  });
});
