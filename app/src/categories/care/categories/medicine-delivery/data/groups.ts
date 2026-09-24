import { GroupDef, IconType } from '../types';

export const GROUPS: Record<string, GroupDef> = {
  vitamins: {
    title: 'Vitamins & Supplements',
    subcats: [
      { id: 'multivitamins', name: 'Multivitamins, Multiminerals', discount: 'Up to 50% off' },
      { id: 'calcium', name: 'Calcium & Minerals', discount: 'Up to 50% off' },
      { id: 'vitaminatoz', name: 'Vitamin A to Z', discount: 'Up to 50% off' },
      { id: 'protein', name: 'Protein Supplements', discount: 'Up to 20% off' },
      { id: 'powder', name: 'Supplement Powder', discount: 'Up to 50% off' },
      { id: 'b12', name: 'Vitamin B12 and B Complex', discount: 'Up to 50% off' },
    ],
  },
  diabetes: {
    title: 'Diabetes Care',
    subcats: [
      { id: 'diet', name: 'Diabetic Diet', discount: 'Up to 25% off' },
      { id: 'substitutes', name: 'Sugar Substitutes', discount: 'Up to 20% off' },
      { id: 'ayurvedic', name: 'Diabetes Ayurvedic', discount: 'Up to 20% off' },
      { id: 'homeopathy', name: 'Homeopathy', discount: 'Up to 20% off' },
      { id: 'syringes-pens', name: 'Syringes and Pens', discount: 'Up to 20% off' },
      { id: 'insulin', name: 'Insulin Injections', discount: 'Up to 15% off' },
    ],
  },
  health: {
    title: 'Health Conditions',
    subcats: [
      { id: 'bone', name: 'Bone and Joint Care', discount: 'Up to 50% off' },
      { id: 'digestive', name: 'Digestive Care', discount: 'Up to 50% off' },
      { id: 'eye', name: 'Eye Care', discount: 'Up to 50% off' },
      { id: 'pain', name: 'Pain Relief', discount: 'Up to 50% off' },
      { id: 'liver', name: 'Liver Care', discount: 'Up to 50% off' },
      { id: 'cardiac', name: 'Heart & Cardiac Care', discount: 'Up to 30% off' },
    ],
  },
};

export const SUBCAT_ICON: Record<string, IconType> = {
  multivitamins: 'capsule',
  calcium: 'pill',
  vitaminatoz: 'pill',
  protein: 'box',
  powder: 'box',
  b12: 'pill',
  diet: 'box',
  substitutes: 'box',
  ayurvedic: 'pill',
  homeopathy: 'drop',
  'syringes-pens': 'syringe',
  insulin: 'needle',
  bone: 'pill',
  digestive: 'drop',
  eye: 'drop',
  pain: 'box',
  liver: 'pill',
  cardiac: 'pill',
};

export const SUBCAT_IMAGE: Record<string, any> = {
  multivitamins: require('../../../assets/medicines/vs-revital.png'),
  calcium: require('../../../assets/medicines/vs-shelcal.png'),
  vitaminatoz: require('../../../assets/medicines/vs-atoz.png'),
  protein: require('../../../assets/medicines/vs-protinex.png'),
  powder: require('../../../assets/medicines/vs-complan.png'),
  b12: require('../../../assets/medicines/vs-neurobion.png'),
  diet: require('../../../assets/medicines/dia-ensure.png'),
  substitutes: require('../../../assets/medicines/dia-sugarfree.png'),
  ayurvedic: require('../../../assets/medicines/dia-bgr34.png'),
  homeopathy: require('../../../assets/medicines/dia-syzygium.png'),
  'syringes-pens': require('../../../assets/medicines/dia-allstar.png'),
  insulin: require('../../../assets/medicines/dia-huminsulin.png'),
  bone: require('../../../assets/medicines/hc-tendocare.png'),
  digestive: require('../../../assets/medicines/hc-gaviscon.png'),
  eye: require('../../../assets/medicines/hc-itone.png'),
  pain: require('../../../assets/medicines/hc-volini.png'),
  liver: require('../../../assets/medicines/hc-liv52.png'),
  cardiac: require('../../../assets/medicines/hc-ecospirin.png'),
};
