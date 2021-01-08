#!/bin/sh
# RegressionSetup.sh
# Run Publisher for a collection of bibles.
# While validate/RegressionTest picks up a bibles in the directory,
# the publisher step is individually coded here because of the paramaters.

ROOTDIR=/Volumes/FCBH/BiblePublisher

BuildPublisher.sh ${ROOTDIR}/BULCBV/source  ${ROOTDIR}/BULCBV  BULCBV  bul null ltr
BuildPublisher.sh ${ROOTDIR}/ENGWEB/source  ${ROOTDIR}/ENGWEB  ENGWEB  eng en   ltr
BuildPublisher.sh ${ROOTDIR}/ERV-ARB/source ${ROOTDIR}/ERV-ARB ERV-ARB arb ar   rtl
BuildPublisher.sh ${ROOTDIR}/ERV-ENG/source ${ROOTDIR}/ERV-ENG ERV-ENG eng en   rtl
BuildPublisher.sh ${ROOTDIR}/HOCIEM/source  ${ROOTDIR}/HOCIEM  HOCIEM  hoc null rtl
BuildPublisher.sh ${ROOTDIR}/HYWWAV/source  ${ROOTDIR}/HYWWAV  HYWWAV  hyw null ltr
BuildPublisher.sh ${ROOTDIR}/KDTWYI/source  ${ROOTDIR}/KDTWYI  KDTWYI  kdt null rtl
BuildPublisher.sh ${ROOTDIR}/PESNMV/source  ${ROOTDIR}/PESNMV  PESNMV  pes ar   rtl


