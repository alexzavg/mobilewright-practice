import type { Screen } from 'mobilewright'

export const chromeLocators = {
  toolbar: (screen: Screen) =>
    screen.getByTestId('com.android.chrome:id/control_container'),
}
