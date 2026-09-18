import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { AuthService } from './auth.service';
import { CaptureComponent } from './capture.component';
import { Profile } from './models';
import { SupabaseService } from './supabase.service';

describe('CaptureComponent', () => {
  let fixture: ComponentFixture<CaptureComponent>;
  let component: CaptureComponent;
  let supabase: jasmine.SpyObj<SupabaseService>;
  const initialProfile: Profile = {
    id: 'player',
    display_name: 'Spieler',
    avatar_url: null,
    current_number: 37,
  };
  const profile = signal<Profile | null>(initialProfile);

  function position(latitude: number): GeolocationPosition {
    return {
      coords: {
        latitude,
        longitude: 8,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
        toJSON: () => ({}),
      },
      timestamp: 1,
      toJSON: () => ({}),
    };
  }

  beforeEach(async () => {
    profile.set({ ...initialProfile });
    supabase = jasmine.createSpyObj<SupabaseService>('SupabaseService', ['saveSighting']);
    supabase.saveSighting.and.resolveTo({ ...initialProfile, current_number: 38 });
    await TestBed.configureTestingModule({
      imports: [CaptureComponent],
      providers: [
        { provide: AuthService, useValue: { profile } },
        { provide: SupabaseService, useValue: supabase },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({ number: '38' }) } },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CaptureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.saveLocation = false;
  });

  it('prefills the next number and applies progress returned by the database', async () => {
    expect(component.number).toBe(38);
    expect(component.buttonLabel()).toBe('Bestätigen');
    await component.submit();
    expect(supabase.saveSighting).toHaveBeenCalledOnceWith({
      number: 38,
      type: 'confirmed',
      latitude: null,
      longitude: null,
      accuracy: null,
      note: null,
    });
    expect(profile()?.current_number).toBe(38);
    expect(component.number).toBeNull();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card.good')?.textContent).toContain(
      '38 gespeichert',
    );
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('allows repeated future hints without increasing progress', async () => {
    supabase.saveSighting.and.resolveTo(initialProfile);
    for (let attempt = 0; attempt < 2; attempt++) {
      component.number = 52;
      expect(component.buttonLabel()).toBe('Vormerken');
      await component.submit();
    }
    expect(supabase.saveSighting).toHaveBeenCalledTimes(2);
    expect(supabase.saveSighting.calls.mostRecent().args[0].type).toBe('hint');
    expect(profile()?.current_number).toBe(37);
  });

  it('does not save completed numbers or invalid input', async () => {
    for (const number of [null, 0, -1, 38.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1, 37]) {
      component.number = number;
      await component.submit();
    }
    expect(supabase.saveSighting).not.toHaveBeenCalled();
    expect(profile()?.current_number).toBe(37);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result-card')?.textContent).toContain(
      '37 ist schon erledigt.',
    );
  });

  it('shows failures and retains inputs without optimistic progress', async () => {
    supabase.saveSighting.and.rejectWith(new Error('network failure'));
    component.note = 'Bahnhof';
    await component.submit();
    fixture.detectChanges();
    const alert: HTMLElement | null = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert?.textContent).toContain('Speichern konnte nicht bestätigt werden');
    expect(component.number).toBe(38);
    expect(component.note).toBe('Bahnhof');
    expect(profile()?.current_number).toBe(37);
    expect(component.saving()).toBeFalse();
    expect(component.saveMessage()).toBe('');
  });

  it('prefills and confirms the next number beyond 999', async () => {
    profile.set({ ...initialProfile, current_number: 999 });
    supabase.saveSighting.and.resolveTo({ ...initialProfile, current_number: 1000 });
    spyOn(TestBed.inject(ActivatedRoute).snapshot.queryParamMap, 'get').and.returnValue('1000');
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.number).toBe(1000);
    expect(component.buttonLabel()).toBe('Bestätigen');
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[name="number"]');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(input.hasAttribute('max')).toBeFalse();
    expect(button.disabled).toBeFalse();
    await component.submit();
    expect(supabase.saveSighting.calls.mostRecent().args[0].number).toBe(1000);
    expect(supabase.saveSighting.calls.mostRecent().args[0].type).toBe('confirmed');
    expect(profile()?.current_number).toBe(1000);
  });

  it('saves numbers beyond 999 as future hints', async () => {
    supabase.saveSighting.and.resolveTo(initialProfile);
    component.number = 10000;
    expect(component.validNumber()).toBeTrue();
    expect(component.buttonLabel()).toBe('Vormerken');
    await component.submit();
    expect(supabase.saveSighting.calls.mostRecent().args[0].number).toBe(10000);
    expect(supabase.saveSighting.calls.mostRecent().args[0].type).toBe('hint');
    expect(profile()?.current_number).toBe(37);
  });

  it('explains a stale progress conflict without displaying success', async () => {
    supabase.saveSighting.and.rejectWith({ code: 'NC001', message: 'Number already completed' });
    await component.submit();
    expect(component.saveError()).toContain('Fortschritt hat sich geändert');
    expect(component.saveMessage()).toBe('');
  });

  it('disables submission and blocks duplicate requests while waiting for GPS', async () => {
    component.saveLocation = true;
    let completeGps: PositionCallback = () => fail('GPS callback missing');
    spyOn(navigator.geolocation, 'getCurrentPosition').and.callFake((success) => {
      completeGps = success;
    });
    const submission = component.submit();
    fixture.detectChanges();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
    expect(button.disabled).toBeTrue();
    expect(component.locationStatus()).toContain('Standort wird erfasst');
    expect(fixture.nativeElement.querySelector('.loading-spinner')).not.toBeNull();
    await component.submit();
    completeGps(position(50));
    await submission;
    expect(supabase.saveSighting).toHaveBeenCalledTimes(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-spinner')).toBeNull();
  });

  it('requests fresh GPS for each capture and does not reuse it after a GPS failure', async () => {
    component.saveLocation = true;
    const gps = spyOn(navigator.geolocation, 'getCurrentPosition');
    gps.and.callFake((success) => success(position(50)));
    await component.submit();
    component.number = 39;
    gps.and.callFake((success) => success(position(51)));
    await component.submit();
    expect(supabase.saveSighting.calls.argsFor(0)[0].latitude).toBe(50);
    expect(supabase.saveSighting.calls.argsFor(1)[0].latitude).toBe(51);
    component.number = 52;
    gps.and.callFake((_success, failure) =>
      failure?.({
        code: 3,
        message: 'timeout',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      }),
    );
    await component.submit();
    expect(supabase.saveSighting.calls.argsFor(2)[0].latitude).toBeNull();
    expect(component.locationStatus()).toBe('Ohne Standort gespeichert.');
    expect(gps.calls.mostRecent().args[2]?.maximumAge).toBe(0);
  });

  it('does not request GPS when location saving is disabled', async () => {
    const gps = spyOn(navigator.geolocation, 'getCurrentPosition');
    await component.submit();
    expect(gps).not.toHaveBeenCalled();
    expect(supabase.saveSighting.calls.mostRecent().args[0].longitude).toBeNull();
  });
});
