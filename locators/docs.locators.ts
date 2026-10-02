import type { Screen } from 'mobilewright'

export const docsLocators = {
  introductionHeading: (screen: Screen) => screen.getByText('Introduction'),
  text: (screen: Screen, text: string) => screen.getByText(text),
}
