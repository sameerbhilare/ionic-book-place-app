import {
  Component,
  OnInit,
  Output,
  EventEmitter,
  ViewChild,
  ElementRef,
  Input,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import {
  Camera,
  CameraResultType,
  CameraSource,
  Photo,
} from '@capacitor/camera';
@Component({
  selector: 'app-image-picker',
  templateUrl: './image-picker.component.html',
  styleUrls: ['./image-picker.component.scss'],
})
export class ImagePickerComponent implements OnInit {
  @Output() imagePick = new EventEmitter<string | File>(); // base64 string representation of the image
  @ViewChild('filePicker') filePickerRef: ElementRef<HTMLInputElement>;
  @Input() showPreview = false;
  selectedImage: string;
  useFilePicker = false;

  constructor(private platform: Platform) {}

  ngOnInit() {
    // hybrid is an indicator for whether we're really running the app on a native mobile device or not.
    // For Desktop (even if you use mobile simulator) - hybrid = false
    // For Real Mobile - hybrid = true
    console.log('Hybrid', this.platform.is('hybrid'));
    console.log('Mobile', this.platform.is('mobile'));
    console.log('iOS', this.platform.is('ios'));
    console.log('Android', this.platform.is('android'));
    console.log('Desktop', this.platform.is('desktop'));

    if (
      (this.platform.is('mobile') && !this.platform.is('hybrid')) ||
      this.platform.is('desktop')
    ) {
      // it means we are running on desktop device
      this.useFilePicker = true;
    }
  }

  async onPickImage() {
    console.log('onPickImage');
    // check if Camera feature is available or if useFilePicker is true
    if (!Capacitor.isPluginAvailable('Camera')) {
      console.log('Camera Plugin not available');
      // this will open the file picker
      this.filePickerRef.nativeElement.click();
      return;
    }

    try {
      // Camera feature is available
      const photo: Photo = await Camera.getPhoto({
        // image quality. max 100, min 1
        quality: 50,
        // CameraSource.Prompt = will ask use to open camera or gallary
        source: CameraSource.Prompt,
        correctOrientation: true,
        // choose appropriate dimensions
        width: 600,
        //height: 320,
        // means that the image is encoded into a string which we then can convert to a file if we want to, or just use like that.
        resultType: CameraResultType.Base64,
      });

      // set the image base64 representation
      this.selectedImage = photo.base64String;
      console.log('Camera Plugin selectedImage', this.selectedImage);
      // emit event
      this.imagePick.emit(photo.base64String);
    } catch (error) {
      console.log('Camera Plugin error', error);
      if (this.useFilePicker) {
        // this will open the file picker
        this.filePickerRef.nativeElement.click();
      }
      return false;
    }
  }

  /*
    This will trigger programmatially
    via code "this.filePickerRef.nativeElement.click();" from above method onPickImage() when filepicker is true
  */
  onFileChosen(event: Event) {
    const pickedFile = (event.target as HTMLInputElement).files[0];
    if (!pickedFile) {
      return;
    }

    // convert to base64 string.
    const fileReader = new FileReader();
    // wait till fileReader.readAsDataURL() function finishes, hence registering for load event
    fileReader.onload = () => {
      const datataUrl = fileReader.result.toString();
      this.selectedImage = datataUrl;

      // emit the pickedfile as it is
      this.imagePick.emit(pickedFile);
    };
    // convert to base64 string. This will set "fileReader.result" once finishes
    fileReader.readAsDataURL(pickedFile);
  }
}
